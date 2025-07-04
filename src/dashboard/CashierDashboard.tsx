import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import GroupIcon from "@mui/icons-material/Group";
import RefreshIcon from "@mui/icons-material/Refresh";

interface CashierDashboardProps {
  onLogout?: () => void;
  onProfile?: () => void;
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
  createdAt: number;
  paid?: boolean;
  paymentMethod?: string;
  amountTendered?: number;
  change?: number;
}

interface LoyaltyCustomer {
  id?: string;
  name: string;
  cars: { carName: string; plateNumber: string }[];
  points?: number;
}

const peso = (v: number) => `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const CashierDashboard: React.FC<CashierDashboardProps> = ({ onLogout, onProfile }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  // State for dashboard stats
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loyaltyCustomers, setLoyaltyCustomers] = useState<LoyaltyCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch payments and loyalty customers
  const fetchData = async () => {
    setLoading(true);
    const [paymentsSnap, loyaltySnap] = await Promise.all([
      getDocs(collection(db, "payments")),
      getDocs(collection(db, "loyalty_customers"))
    ]);
    setPayments(paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRecord[]);
    setLoyaltyCustomers(loyaltySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LoyaltyCustomer[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute today's stats
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();

  const todaysPayments = payments.filter(
    p => p.createdAt >= startOfDay && p.createdAt <= endOfDay
  );

  const todaysPaid = todaysPayments.filter(p => p.paid);
  const todaysUnpaid = todaysPayments.filter(p => !p.paid);

  const todaySales = todaysPaid.reduce((sum, p) => sum + (typeof p.price === "number" ? p.price : 0), 0);

  // Most availed services (top 3)
  const serviceCount: { [serviceName: string]: number } = {};
  todaysPayments.forEach(p => {
    if (p.serviceName) {
      serviceCount[p.serviceName] = (serviceCount[p.serviceName] || 0) + 1;
    }
  });
  const mostAvailed = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Total loyalty customers
  const totalLoyaltyCustomers = loyaltyCustomers.length;

  // All-time stats
  const allPaid = payments.filter(p => p.paid);
  const allUnpaid = payments.filter(p => !p.paid);
  const allSales = allPaid.reduce((sum, p) => sum + (typeof p.price === "number" ? p.price : 0), 0);

  // All-time most availed services (top 3)
  const allServiceCount: { [serviceName: string]: number } = {};
  payments.forEach(p => {
    if (p.serviceName) {
      allServiceCount[p.serviceName] = (allServiceCount[p.serviceName] || 0) + 1;
    }
  });
  const allMostAvailed = Object.entries(allServiceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Ensure onProfile and onLogout work with navigation
  const handleProfile = () => {
    if (onProfile) onProfile();
    navigate("/profile");
  };
  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  // Skeleton loader for cards
  const StatSkeleton = () => (
    <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 3, mb: 1 }} />
  );

  return (
    <AppSidebar
      role="cashier"
      onLogout={handleLogoutClick}
      onProfile={handleProfile}
    >
      <Box sx={{ p: { xs: 1, sm: 4 }, maxWidth: 1200, mx: "auto", width: "100%" }}>
        {/* Header Section */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            borderRadius: 3,
            boxShadow: theme.shadows[2],
            background: "linear-gradient(90deg, #f8fafc 60%, #e3f2fd 100%)"
          }}
        >
          <Box>
            <Typography variant={isSm ? "h6" : "h4"} fontWeight={700} gutterBottom>
              Cashier Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome, Cashier! Here is your summary for today and all time.
            </Typography>
          </Box>
          <Tooltip title="Refresh Data">
            <Button
              onClick={fetchData}
              variant="outlined"
              color="primary"
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                minWidth: 44,
                px: 2,
                py: 1,
                alignSelf: { xs: "flex-end", sm: "center" }
              }}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Tooltip>
        </Paper>

        {/* Dashboard Stats as Flex Cards */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            mb: 3,
            justifyContent: { xs: "center", sm: "flex-start" }
          }}
        >
          {/* Today's Sales */}
          <Card
            elevation={4}
            sx={{
              flex: "1 1 220px",
              minWidth: 220,
              borderLeft: "5px solid #43a047",
              borderRadius: 3,
              bgcolor: "background.paper"
            }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <MonetizationOnIcon color="success" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Today's Sales
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {loading ? <StatSkeleton /> : peso(todaySales)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All Time: {loading ? <StatSkeleton /> : peso(allSales)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          {/* Paid Services */}
          <Card
            elevation={4}
            sx={{
              flex: "1 1 220px",
              minWidth: 220,
              borderLeft: "5px solid #1976d2",
              borderRadius: 3,
              bgcolor: "background.paper"
            }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CheckCircleIcon color="primary" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Paid Services
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {loading ? <StatSkeleton /> : todaysPaid.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All Time: {loading ? <StatSkeleton /> : allPaid.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          {/* Unpaid Services */}
          <Card
            elevation={4}
            sx={{
              flex: "1 1 220px",
              minWidth: 220,
              borderLeft: "5px solid #fbc02d",
              borderRadius: 3,
              bgcolor: "background.paper"
            }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <HourglassEmptyIcon color="warning" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Unpaid Services
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {loading ? <StatSkeleton /> : todaysUnpaid.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  All Time: {loading ? <StatSkeleton /> : allUnpaid.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          {/* Loyalty Customers */}
          <Card
            elevation={4}
            sx={{
              flex: "1 1 220px",
              minWidth: 220,
              borderLeft: "5px solid #00bcd4",
              borderRadius: 3,
              bgcolor: "background.paper"
            }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <GroupIcon color="info" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Loyalty Customers
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {loading ? <StatSkeleton /> : totalLoyaltyCustomers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Most Availed Services */}
        <Paper elevation={3} sx={{ mb: 3, borderRadius: 3, p: { xs: 2, sm: 3 }, bgcolor: "background.paper" }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            <EmojiEventsIcon color="warning" sx={{ mr: 1, verticalAlign: "middle" }} />
            Most Availed Services Today
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {loading ? (
            <Stack direction="row" spacing={2}>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </Stack>
          ) : mostAvailed.length === 0 ? (
            <Typography color="text.secondary">No services availed today.</Typography>
          ) : (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {mostAvailed.map(([service, count], idx) => (
                <Chip
                  key={service}
                  label={`${service} (${count})`}
                  color={idx === 0 ? "warning" : idx === 1 ? "info" : "default"}
                  icon={<EmojiEventsIcon />}
                  sx={{ fontWeight: 600, fontSize: 16, px: 2, py: 1 }}
                />
              ))}
            </Box>
          )}
        </Paper>
        <Paper elevation={3} sx={{ mb: 3, borderRadius: 3, p: { xs: 2, sm: 3 }, bgcolor: "background.paper" }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            <EmojiEventsIcon color="primary" sx={{ mr: 1, verticalAlign: "middle" }} />
            Most Availed Services (All Time)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {loading ? (
            <Stack direction="row" spacing={2}>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </Stack>
          ) : allMostAvailed.length === 0 ? (
            <Typography color="text.secondary">No services availed yet.</Typography>
          ) : (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {allMostAvailed.map(([service, count], idx) => (
                <Chip
                  key={service}
                  label={`${service} (${count})`}
                  color={idx === 0 ? "primary" : idx === 1 ? "info" : "default"}
                  icon={<EmojiEventsIcon />}
                  sx={{ fontWeight: 600, fontSize: 16, px: 2, py: 1 }}
                />
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </AppSidebar>
  );
};

export default CashierDashboard;