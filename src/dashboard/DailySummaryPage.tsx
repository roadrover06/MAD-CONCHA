import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AppSidebar from "./AppSidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PaymentIcon from "@mui/icons-material/Payment";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";

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
  voided?: boolean;
}

const peso = (v: number) => `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const DailySummaryPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "payments"));
      setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRecord[]);
      setLoading(false);
    };
    fetchPayments();
  }, []);

  // Today's range
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();

  const todaysPayments = payments.filter(
    p => p.createdAt >= startOfDay && p.createdAt <= endOfDay
  );
  const todaysPaid = todaysPayments.filter(p => p.paid);
  const todaysUnpaid = todaysPayments.filter(p => !p.paid);
  const todaySales = todaysPaid.reduce((sum, p) => sum + (typeof p.price === "number" ? p.price : 0), 0);

  // Sales by service
  const serviceSales: { [service: string]: number } = {};
  todaysPaid.forEach(p => {
    if (p.serviceName) {
      serviceSales[p.serviceName] = (serviceSales[p.serviceName] || 0) + p.price;
    }
  });

  // Payment method breakdown
  const paymentMethodCount: { [method: string]: number } = {};
  todaysPaid.forEach(p => {
    const method = p.paymentMethod || "Other";
    paymentMethodCount[method] = (paymentMethodCount[method] || 0) + 1;
  });

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <AppSidebar role="cashier" onLogout={handleLogout}>
      <Box sx={{ maxWidth: 1100, mx: "auto", mt: 2, px: { xs: 1, sm: 2 }, pb: 6 }}>
        {/* Header Section */}
        <Box sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
          borderRadius: 3,
          boxShadow: 2,
          background: "linear-gradient(90deg, #f8fafc 60%, #e3f2fd 100%)",
          p: { xs: 2, sm: 3 }
        }}>
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} gutterBottom>
              <ReceiptIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Daily Summary
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Overview of today's sales and transactions.
            </Typography>
          </Box>
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={() => window.location.reload()}
              color="primary"
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                minWidth: 44,
                px: 2,
                py: 1,
                alignSelf: { xs: "flex-end", sm: "center" }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {/* Summary Cards */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
          <Card sx={{
            flex: "1 1 220px", minWidth: 220,
            borderLeft: "5px solid #43a047", borderRadius: 3, bgcolor: "background.paper"
          }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <MonetizationOnIcon color="success" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Sales (Paid)
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {loading ? <Skeleton width={80} /> : peso(todaySales)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{
            flex: "1 1 220px", minWidth: 220,
            borderLeft: "5px solid #1976d2", borderRadius: 3, bgcolor: "background.paper"
          }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CheckCircleIcon color="primary" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Paid Transactions
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {loading ? <Skeleton width={40} /> : todaysPaid.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{
            flex: "1 1 220px", minWidth: 220,
            borderLeft: "5px solid #fbc02d", borderRadius: 3, bgcolor: "background.paper"
          }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <HourglassEmptyIcon color="warning" sx={{ fontSize: 36 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Unpaid Transactions
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {loading ? <Skeleton width={40} /> : todaysUnpaid.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        {/* Sales by Service */}
        <Card sx={{ mb: 3, borderRadius: 3, bgcolor: "background.paper" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Sales by Service
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Skeleton width={180} />
            ) : Object.keys(serviceSales).length === 0 ? (
              <Typography color="text.secondary">No paid services today.</Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {Object.entries(serviceSales).map(([service, total]) => (
                  <Chip
                    key={service}
                    label={`${service}: ${peso(total)}`}
                    color="primary"
                    sx={{ fontWeight: 600, fontSize: 16, px: 2, py: 1 }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
        {/* Payment Method Breakdown */}
        <Card sx={{ mb: 3, borderRadius: 3, bgcolor: "background.paper" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Payment Methods
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Skeleton width={180} />
            ) : Object.keys(paymentMethodCount).length === 0 ? (
              <Typography color="text.secondary">No paid transactions today.</Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {Object.entries(paymentMethodCount).map(([method, count]) => (
                  <Chip
                    key={method}
                    label={`${method.charAt(0).toUpperCase() + method.slice(1)}: ${count}`}
                    color="secondary"
                    icon={<PaymentIcon />}
                    sx={{ fontWeight: 600, fontSize: 16, px: 2, py: 1 }}
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
        {/* Table of Today's Transactions */}
        <Card sx={{ borderRadius: 3, bgcolor: "background.paper" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Today's Transactions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Car</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Plate #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todaysPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary" sx={{ py: 3 }}>
                          No transactions today.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    todaysPayments.map((r) => (
                      <TableRow key={r.id} hover sx={{ transition: "background 0.2s", "&:hover": { bgcolor: "action.selected" } }}>
                        <TableCell>
                          <Typography fontWeight={600}>{r.customerName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {r.cashierFullName || r.cashier}
                          </Typography>
                        </TableCell>
                        <TableCell>{r.carName}</TableCell>
                        <TableCell>{r.plateNumber || "-"}</TableCell>
                        <TableCell>{r.serviceName}</TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>{peso(r.price)}</Typography>
                        </TableCell>
                        <TableCell>
                          {r.voided ? (
                            <Chip label="Voided" color="error" size="small" />
                          ) : (
                            <Chip
                              label={r.paid ? "Paid" : "Unpaid"}
                              color={r.paid ? "success" : "warning"}
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {r.paymentMethod ? r.paymentMethod.charAt(0).toUpperCase() + r.paymentMethod.slice(1) : "-"}
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          {new Date(r.createdAt).toLocaleTimeString()}
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

export default DailySummaryPage;
