import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack, // Added for consistent spacing
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import moment, { Moment } from "moment";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import AppSidebar from "./AppSidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  MonetizationOn as MonetizationOnIcon,
  Build as BuildIcon,
  Group as GroupIcon,
  EmojiEvents as EmojiEventsIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  TableChart as TableChartIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

interface AdminDashboardProps {
  onLogout?: () => void;
  onProfile?: () => void;
  firstName?: string;
  lastName?: string;
}

interface PaymentRecord {
  id?: string;
  customerName: string;
  carName: string;
  plateNumber: string;
  variety: string;
  serviceId: string;
  serviceName: string;
  price: number;
  cashier: string;
  cashierFullName?: string;
  employees: { id: string; name: string; commission: number }[];
  referrer?: { id: string; name: string; commission: number };
  createdAt: number; // Unix timestamp
  paid?: boolean;
  paymentMethod?: string;
  amountTendered?: number;
  change?: number;
  voided?: boolean; // Ensure this is present if you use it for filtering
}

interface LoyaltyCustomer {
  id?: string;
  name: string;
  cars: { carName: string; plateNumber: string }[];
  points?: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  prices: { [variety: string]: number };
}

// Helper function to format currency
const peso = (v: number) => `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const StatCard = ({
  icon,
  title,
  value,
  loading,
  color = "primary"
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  loading: boolean;
  color?: "primary" | "secondary" | "success" | "info" | "warning" | "error";
}) => (
  <Card
    component={motion.div}
    whileHover={{ y: -4 }}
    sx={{
      flex: "1 1 240px",
      minWidth: 240,
      borderRadius: 3,
      boxShadow: 2,
      transition: 'transform 0.2s',
      '&:hover': {
        boxShadow: 4,
      }
    }}
  >
    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.light`,
          color: `${color}.dark`,
          borderRadius: 2,
          p: 2,
          minWidth: 56,
          minHeight: 56
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width={100} height={32} />
        ) : (
          <Typography variant="h5" fontWeight={700} color={`${color}.main`}>
            {value}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onProfile,
  firstName = "",
  lastName = ""
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState<LoyaltyCustomer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // State for shift report date range
  const [reportStartDate, setReportStartDate] = useState<Moment | null>(moment().startOf('day'));
  const [reportEndDate, setReportEndDate] = useState<Moment | null>(moment().endOf('day'));
  // New state for shift selection
  const [reportShiftType, setReportShiftType] = useState<'all' | 'shift1' | 'shift2'>('all');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [paymentsSnap, loyaltySnap, employeesSnap, servicesSnap] = await Promise.all([
          getDocs(collection(db, "payments")),
          getDocs(collection(db, "loyalty_customers")),
          getDocs(collection(db, "employees")),
          getDocs(collection(db, "services"))
        ]);
        setPayments(paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRecord[]);
        setLoyaltyCustomers(loyaltySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LoyaltyCustomer[]);
        setEmployees(employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[]);
        setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Overall sales (paid only, not voided)
  const allPaidNonVoided = payments.filter(p => p.paid && !p.voided);
  const overallSales = allPaidNonVoided.reduce((sum, p) => sum + (typeof p.price === "number" ? p.price : 0), 0);

  // Number of services
  const totalServices = services.length;

  // Loyalty customers count
  const totalLoyaltyCustomers = loyaltyCustomers.length;

  // Employees count
  const totalEmployees = employees.length;

  // Most availed services (all time, top 3, paid and not voided)
  const serviceCount: { [serviceName: string]: number } = {};
  allPaidNonVoided.forEach(p => {
    if (p.serviceName) {
      serviceCount[p.serviceName] = (serviceCount[p.serviceName] || 0) + 1;
    }
  });
  const mostAvailed = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Top customers by number of paid records (top 3, not voided)
  const customerCount: { [customerName: string]: number } = {};
  allPaidNonVoided.forEach(p => {
    if (p.customerName) {
      customerCount[p.customerName] = (customerCount[p.customerName] || 0) + 1;
    }
  });
  const topCustomers = Object.entries(customerCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // --- Shift Sales Logic ---

  /**
   * Filters payment records for a specific shift within a given date range.
   * @param payments All payment records.
   * @param startMoment Moment object for the start date of the report range.
   * @param endMoment Moment object for the end date of the report range.
   * @param shiftType 'shift1' (8 AM - 8 PM) or 'shift2' (8 PM - 8 AM next day).
   * @returns Filtered list of payment records for the specified shift and date range.
   */
  const getShiftPayments = (
    payments: PaymentRecord[],
    startMoment: Moment,
    endMoment: Moment,
    shiftType: 'shift1' | 'shift2'
  ): PaymentRecord[] => {
    // Define exact shift boundaries in hours for a standard day
    const SHIFT1_START_HOUR = 8; // 8:00 AM
    const SHIFT1_END_HOUR = 20;  // 8:00 PM (20:00)

    const SHIFT2_START_HOUR = 20; // 8:00 PM (20:00)
    // Shift 2 technically ends at 8 AM next day, handled by logic below

    return payments.filter(p => {
      const paymentTime = moment.unix(p.createdAt / 1000); // Convert Unix timestamp (milliseconds) to Moment object

      // 1. Filter by selected report date range (inclusive of full days)
      const isWithinReportRange = paymentTime.isSameOrAfter(startMoment.clone().startOf('day')) &&
                                  paymentTime.isSameOrBefore(endMoment.clone().endOf('day'));

      if (!isWithinReportRange) {
        return false;
      }

      // 2. Filter by shift type for the specific payment time
      const paymentHour = paymentTime.hour();

      if (shiftType === 'shift1') {
        // Shift 1: 8:00 AM (inclusive) to 8:00 PM (exclusive) on the same day
        return paymentHour >= SHIFT1_START_HOUR && paymentHour < SHIFT1_END_HOUR;
      } else { // shiftType === 'shift2'
        // Shift 2: 8:00 PM (inclusive) to 8:00 AM next day (exclusive)
        // This requires checking if the payment is on the "current" day but after 8 PM,
        // or on the "next" day but before 8 AM.

        // Calculate the "effective" shift day start for the payment
        // If payment is before 8 AM, it belongs to Shift 2 of the *previous* calendar day.
        // If payment is 8 AM or later, it belongs to Shift 2 of the *current* calendar day.
        let effectiveShiftDayStart;
        if (paymentHour < SHIFT1_START_HOUR) { // e.g., 6 AM, 7 AM means it's part of Shift 2 from previous day
            effectiveShiftDayStart = paymentTime.clone().subtract(1, 'day').startOf('day');
        } else {
            effectiveShiftDayStart = paymentTime.clone().startOf('day');
        }

        const shift2StartMoment = effectiveShiftDayStart.clone().hour(SHIFT2_START_HOUR);
        const shift2EndMoment = effectiveShiftDayStart.clone().add(1, 'day').hour(SHIFT1_START_HOUR); // 8:00 AM next day

        return paymentTime.isSameOrAfter(shift2StartMoment) && paymentTime.isBefore(shift2EndMoment);
      }
    });
  };

  // Filter payments for the selected date range first, then apply shift filter
  const paymentsInReportRange = payments.filter(p => {
    const paymentTime = moment.unix(p.createdAt / 1000); // Use /1000 if createdAt is in milliseconds
    return reportStartDate && reportEndDate &&
           paymentTime.isSameOrAfter(reportStartDate.clone().startOf('day')) &&
           paymentTime.isSameOrBefore(reportEndDate.clone().endOf('day')) &&
           !p.voided; // Only consider non-voided payments for sales
  });

  const shift1Payments = getShiftPayments(paymentsInReportRange, reportStartDate!, reportEndDate!, 'shift1');
  const shift2Payments = getShiftPayments(paymentsInReportRange, reportStartDate!, reportEndDate!, 'shift2');

  const shift1Sales = shift1Payments.reduce((sum, p) => sum + (typeof p.price === "number" ? p.price : 0), 0);
  const shift2Sales = shift2Payments.reduce((sum, p) => sum + (typeof p.price === "number" ? p.price : 0), 0);

  // --- Report Generation Functions ---

  const generateExcelReport = () => {
    if (!reportStartDate || !reportEndDate) {
      alert("Please select a valid date range for the report.");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Shift Sales Report Summary'],
      [`Date Range: ${reportStartDate.format('YYYY-MM-DD')} to ${reportEndDate.format('YYYY-MM-DD')}`],
      [],
      ['Shift', 'Total Sales', 'Number of Transactions'],
      ['Shift 1 (8 AM - 8 PM)', peso(shift1Sales), shift1Payments.length],
      ['Shift 2 (8 PM - 8 AM next day)', peso(shift2Sales), shift2Payments.length],
      ['Overall Total', peso(shift1Sales + shift2Sales), shift1Payments.length + shift2Payments.length],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Conditionally add detail sheets based on reportShiftType
    if (reportShiftType === 'all' || reportShiftType === 'shift1') {
      const ws1Data = shift1Payments.map(p => ({
        'Payment ID': p.id,
        'Date & Time': moment.unix(p.createdAt / 1000).format('YYYY-MM-DD HH:mm:ss'),
        'Customer Name': p.customerName,
        'Service Name': p.serviceName,
        'Price': p.price,
        'Cashier': p.cashierFullName || p.cashier,
        'Payment Method': p.paymentMethod || 'N/A',
      }));
      if (ws1Data.length > 0) {
        const ws1 = XLSX.utils.json_to_sheet(ws1Data);
        XLSX.utils.book_append_sheet(wb, ws1, "Shift 1 Details");
      } else {
        const ws1 = XLSX.utils.aoa_to_sheet([['No sales records for Shift 1 in this period.']]);
        XLSX.utils.book_append_sheet(wb, ws1, "Shift 1 Details");
      }
    }

    if (reportShiftType === 'all' || reportShiftType === 'shift2') {
      const ws2Data = shift2Payments.map(p => ({
        'Payment ID': p.id,
        'Date & Time': moment.unix(p.createdAt / 1000).format('YYYY-MM-DD HH:mm:ss'),
        'Customer Name': p.customerName,
        'Service Name': p.serviceName,
        'Price': p.price,
        'Cashier': p.cashierFullName || p.cashier,
        'Payment Method': p.paymentMethod || 'N/A',
      }));
      if (ws2Data.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(ws2Data);
        XLSX.utils.book_append_sheet(wb, ws2, "Shift 2 Details");
      } else {
        const ws2 = XLSX.utils.aoa_to_sheet([['No sales records for Shift 2 in this period.']]);
        XLSX.utils.book_append_sheet(wb, ws2, "Shift 2 Details");
      }
    }

    XLSX.writeFile(wb, `Shift_Sales_Report_${reportStartDate.format('YYYY-MM-DD')}_to_${reportEndDate.format('YYYY-MM-DD')}.xlsx`);
  };

  return (
    <AppSidebar
      role="admin"
      onLogout={onLogout}
      onProfile={onProfile}
      firstName={firstName}
      lastName={lastName}
    >
      <Box sx={{
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: 1400,
        mx: "auto",
        width: '100%'
      }}>
        {/* Header */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'common.white',
            boxShadow: 3
          }}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Welcome back, {firstName}! Here's what's happening with your business.
          </Typography>
        </Paper>

        {/* Dashboard Stats */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mb: 4,
            justifyContent: { xs: "center", md: "flex-start" }
          }}
        >
          <StatCard
            icon={<MonetizationOnIcon sx={{ fontSize: 28 }} />}
            title="Overall Sales"
            value={peso(overallSales)}
            loading={loading}
            color="success"
          />
          <StatCard
            icon={<BuildIcon sx={{ fontSize: 28 }} />}
            title="Total Services"
            value={totalServices}
            loading={loading}
            color="info"
          />
          <StatCard
            icon={<PeopleIcon sx={{ fontSize: 28 }} />}
            title="Loyalty Customers"
            value={totalLoyaltyCustomers}
            loading={loading}
            color="warning"
          />
          <StatCard
            icon={<GroupIcon sx={{ fontSize: 28 }} />}
            title="Total Employees"
            value={totalEmployees}
            loading={loading}
            color="secondary"
          />
        </Box>

        {/* Analytics Sections */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 4 }}>
          {/* Most Availed Services */}
          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              boxShadow: 2,
              minWidth: 300
            }}
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="warning" sx={{ mr: 1.5, fontSize: 32 }} />
                <Typography variant="h6" fontWeight={700}>
                  Most Availed Services
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {loading ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rounded" width={120} height={40} />
                  ))}
                </Box>
              ) : mostAvailed.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No services availed yet.
                </Typography>
              ) : (
                <Box sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  '& .MuiChip-root': {
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    fontSize: 15
                  }
                }}>
                  {mostAvailed.map(([service, count], idx) => (
                    <Chip
                      key={service}
                      label={`${service} (${count})`}
                      color={idx === 0 ? "warning" : idx === 1 ? "info" : "default"}
                      icon={<EmojiEventsIcon />}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card
            sx={{
              flex: 1,
              borderRadius: 3,
              boxShadow: 2,
              minWidth: 300
            }}
            component={motion.div}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon color="primary" sx={{ mr: 1.5, fontSize: 32 }} />
                <Typography variant="h6" fontWeight={700}>
                  Top Customers
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              {loading ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rounded" width={120} height={40} />
                  ))}
                </Box>
              ) : topCustomers.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No customer records yet.
                </Typography>
              ) : (
                <Box sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  '& .MuiChip-root': {
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    fontSize: 15
                  }
                }}>
                  {topCustomers.map(([customer, count], idx) => (
                    <Chip
                      key={customer}
                      label={`${customer} (${count})`}
                      color={idx === 0 ? "primary" : idx === 1 ? "info" : "default"}
                      icon={<PersonIcon />}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* --- Shift Sales Report Section --- */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 2,
            p: 3,
            mb: 4,
            transition: 'transform 0.2s',
            '&:hover': {
              boxShadow: 4,
            }
          }}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MonetizationOnIcon color="success" sx={{ mr: 1.5, fontSize: 32 }} />
              <Typography variant="h6" fontWeight={700}>
                Shift Sales Reports
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <LocalizationProvider dateAdapter={AdapterMoment}>
              <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
                <DatePicker
                  label="Start Date"
                  value={reportStartDate}
                  onChange={(newValue: Moment | null) => setReportStartDate(newValue)}
                  enableAccessibleFieldDOMStructure={false}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={reportEndDate}
                  onChange={(newValue: Moment | null) => setReportEndDate(newValue)}
                  enableAccessibleFieldDOMStructure={false}
                  slots={{ textField: TextField }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Stack>
            </LocalizationProvider>

            {/* Shift Selection Dropdown */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="shift-select-label">Select Shift for Report</InputLabel>
              <Select
                labelId="shift-select-label"
                id="shift-select"
                value={reportShiftType}
                label="Select Shift for Report"
                onChange={(e) => setReportShiftType(e.target.value as 'all' | 'shift1' | 'shift2')}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Shifts (Includes Shift 1 & 2 for selected period)</MenuItem>
                <MenuItem value="shift1">Shift 1 (8:00 AM - 7:59 PM)</MenuItem>
                <MenuItem value="shift2">Shift 2 (8:00 PM - 7:59 AM Next Day)</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Sales for Selected Period ({reportStartDate?.format('MMM DD, YYYY')} to {reportEndDate?.format('MMM DD, YYYY')})
              </Typography>
              {loading ? (
                <Stack spacing={1}>
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="text" width="70%" height={24} />
                  <Skeleton variant="text" width="60%" height={28} />
                </Stack>
              ) : (
                <>
                  <Typography variant="body1">
                    <strong>Shift 1 (8 AM - 8 PM):</strong> {peso(shift1Sales)} ({shift1Payments.length} transactions)
                  </Typography>
                  <Typography variant="body1">
                    <strong>Shift 2 (8 PM - 8 AM next day):</strong> {peso(shift2Sales)} ({shift2Payments.length} transactions)
                  </Typography>
                  <Typography variant="h6" mt={1}>
                    <strong>Total Sales for Period:</strong> {peso(shift1Sales + shift2Sales)}
                  </Typography>
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<TableChartIcon />}
                onClick={generateExcelReport}
                disabled={loading || !reportStartDate || !reportEndDate}
                sx={{ flex: 1, py: 1.5, borderRadius: 2 }}
              >
                Generate Excel Report
              </Button>
            </Box>
          </CardContent>
        </Card>
        {/* --- End Shift Sales Report Section --- */}

      </Box>
    </AppSidebar>
  );
};

export default AdminDashboard;