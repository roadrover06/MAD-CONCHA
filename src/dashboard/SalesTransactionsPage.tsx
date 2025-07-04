import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  TextField,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  Badge
} from "@mui/material";
import AppSidebar from "./AppSidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import {
  PointOfSale as PointOfSaleIcon,
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Paid as PaidIcon,
  MoneyOff as MoneyOffIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon
} from "@mui/icons-material";
import { format } from "date-fns";
import { motion } from "framer-motion";

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
  createdAt: number;
  paid?: boolean;
  paymentMethod?: string;
  amountTendered?: number;
  change?: number;
}

const peso = (v: number) => `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const SalesTransactionsPage: React.FC = () => {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchPlate, setSearchPlate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "paid" | "unpaid">("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  const fetchRecords = async () => {
    setRefreshing(true);
    try {
      const snap = await getDocs(collection(db, "payments"));
      setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRecord[]);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Unique services for filter dropdown
  const uniqueServices = Array.from(new Set(records.map(r => r.serviceName).filter(Boolean)));

  // Filtered records
  const filteredRecords = records.filter(r => {
    const customerMatch = r.customerName.toLowerCase().includes(searchCustomer.toLowerCase());
    const plateMatch = r.plateNumber?.toLowerCase().includes(searchPlate.toLowerCase());
    const statusMatch =
      statusFilter === ""
        ? true
        : statusFilter === "paid"
        ? !!r.paid
        : !r.paid;
    const serviceMatch = serviceFilter ? r.serviceName === serviceFilter : true;
    const dateMatch = dateFilter 
      ? format(new Date(r.createdAt), 'yyyy-MM-dd') === dateFilter
      : true;
    
    return customerMatch && plateMatch && statusMatch && serviceMatch && dateMatch;
  });

  // Quick stats
  const totalSales = records.filter(r => r.paid).reduce((sum, r) => sum + (typeof r.price === "number" ? r.price : 0), 0);
  const paidCount = records.filter(r => r.paid).length;
  const unpaidCount = records.filter(r => !r.paid).length;

  // Get role from localStorage (default to 'cashier' for backward compatibility)
  const role = (localStorage.getItem("role") as "admin" | "cashier") || "cashier";

  return (
    <AppSidebar role={role}>
      <Box sx={{ maxWidth: 1400, mx: "auto", mt: 2, px: { xs: 1, sm: 2 } }}>
        {/* Header Section */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              <PointOfSaleIcon sx={{ mr: 1, verticalAlign: "middle", color: "primary.main" }} />
              Sales Transactions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage all payment transactions
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={fetchRecords} 
                color="primary"
                sx={{ mr: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {/* Removed Print and Export Data buttons */}
          </Box>
        </Box>

        {/* Quick Stats */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 3,
            mb: 3,
          }}
        >
          <Card
            component={motion.div}
            whileHover={{ scale: 1.02 }}
            sx={{
              flex: 1,
              borderLeft: "4px solid",
              borderColor: "success.main",
              mb: { xs: 2, sm: 0 },
              height: "100%",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Avatar sx={{ bgcolor: "success.light", mr: 2 }}>
                  <PaidIcon color="success" />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Sales (Paid)
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {loading ? "..." : peso(totalSales)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All time
              </Typography>
            </CardContent>
          </Card>
          <Card
            component={motion.div}
            whileHover={{ scale: 1.02 }}
            sx={{
              flex: 1,
              borderLeft: "4px solid",
              borderColor: "info.main",
              mb: { xs: 2, sm: 0 },
              height: "100%",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Avatar sx={{ bgcolor: "info.light", mr: 2 }}>
                  <AttachMoneyIcon color="info" />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Paid Transactions
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {loading ? "..." : paidCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completed payments
              </Typography>
            </CardContent>
          </Card>
          <Card
            component={motion.div}
            whileHover={{ scale: 1.02 }}
            sx={{
              flex: 1,
              borderLeft: "4px solid",
              borderColor: "warning.main",
              height: "100%",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Avatar sx={{ bgcolor: "warning.light", mr: 2 }}>
                  <MoneyOffIcon color="warning" />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Unpaid Transactions
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {loading ? "..." : unpaidCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending payments
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filters Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <FilterIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Filters
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ flex: "1 1 200px", minWidth: 180 }}>
                <TextField
                  fullWidth
                  label="Search Customer"
                  value={searchCustomer}
                  onChange={e => setSearchCustomer(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />
                  }}
                />
              </Box>
              <Box sx={{ flex: "1 1 200px", minWidth: 180 }}>
                <TextField
                  fullWidth
                  label="Search Plate #"
                  value={searchPlate}
                  onChange={e => setSearchPlate(e.target.value)}
                  size="small"
                />
              </Box>
              <Box sx={{ flex: "1 1 140px", minWidth: 120 }}>
                <Select
                  fullWidth
                  value={serviceFilter}
                  onChange={e => setServiceFilter(e.target.value)}
                  size="small"
                  displayEmpty
                >
                  <MenuItem value="">All Services</MenuItem>
                  {uniqueServices.map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Box sx={{ flex: "1 1 120px", minWidth: 100 }}>
                <Select
                  fullWidth
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as "" | "paid" | "unpaid")}
                  size="small"
                  displayEmpty
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="unpaid">Unpaid</MenuItem>
                </Select>
              </Box>
              <Box sx={{ flex: "1 1 140px", minWidth: 120 }}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarIcon fontSize="small" sx={{ mr: 1, color: "action.active" }} />
                  }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Transactions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredRecords.length} of {records.length} records
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {refreshing && <LinearProgress sx={{ mb: 2 }} />}
            
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Car Details</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <SearchIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                          <Typography color="text.secondary">
                            No transactions found matching your criteria
                          </Typography>
                          <Button 
                            variant="text" 
                            size="small" 
                            sx={{ mt: 1 }}
                            onClick={() => {
                              setSearchCustomer("");
                              setSearchPlate("");
                              setStatusFilter("");
                              setServiceFilter("");
                              setDateFilter("");
                            }}
                          >
                            Clear filters
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((r) => (
                      <TableRow 
                        key={r.id}
                        hover
                        sx={{ 
                          '&:last-child td': { borderBottom: 0 },
                          bgcolor: r.paid ? "transparent" : "action.hover"
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight={500}>{r.customerName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {r.cashierFullName || r.cashier}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{r.carName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {r.plateNumber || "No plate"}
                          </Typography>
                        </TableCell>
                        <TableCell>{r.serviceName}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={500}>
                            {peso(r.price)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.paid ? "Paid" : "Unpaid"}
                            color={r.paid ? "success" : "warning"}
                            size="small"
                            variant={r.paid ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>
                          {r.paymentMethod ? (
                            <Chip
                              label={r.paymentMethod.charAt(0).toUpperCase() + r.paymentMethod.slice(1)}
                              size="small"
                              variant="outlined"
                            />
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Typography>
                            {format(new Date(r.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(r.createdAt), 'hh:mm a')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </AppSidebar>
  );
};

export default SalesTransactionsPage;