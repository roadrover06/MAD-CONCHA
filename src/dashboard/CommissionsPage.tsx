import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Select,
  MenuItem,
  InputAdornment,
  TextField,
  useTheme,
  useMediaQuery,
  Button
} from "@mui/material";
import AppSidebar from "./AppSidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import GroupIcon from "@mui/icons-material/Group";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface PaymentRecord {
  id?: string;
  employees: { id: string; name: string; commission: number }[];
  referrer?: { id: string; name: string; commission: number };
  createdAt: number;
  paid?: boolean;
  serviceName: string;
  price: number;
}

const peso = (v: number) => `₱${v.toLocaleString()}`;

const CommissionsPage: React.FC<{
  onLogout?: () => void;
  onProfile?: () => void;
  firstName?: string;
  lastName?: string;
}> = ({ onLogout, onProfile, firstName, lastName }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setRefreshing(true);
    const empSnap = await getDocs(collection(db, "employees"));
    setEmployees(empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[]);
    const paySnap = await getDocs(collection(db, "payments"));
    setPayments(paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PaymentRecord[]);
    setRefreshing(false);
  };

  // Filter payments by date range
  const filteredPayments = payments.filter(p => {
    if (!p.paid) return false;
    let match = true;
    if (dateFrom) {
      const from = new Date(dateFrom).setHours(0, 0, 0, 0);
      match = match && p.createdAt >= from;
    }
    if (dateTo) {
      const to = new Date(dateTo).setHours(23, 59, 59, 999);
      match = match && p.createdAt <= to;
    }
    return match;
  });

  // Aggregate commissions per employee (labor + referrer) for filteredPayments
  const commissionMap: {
    [empId: string]: {
      name: string;
      total: number;
      labor: number;
      referrer: number;
      count: number;
    };
  } = {};

  filteredPayments.forEach((p) => {
    // Labor commissions
    if (Array.isArray(p.employees)) {
      p.employees.forEach(e => {
        if (!commissionMap[e.id]) {
          commissionMap[e.id] = {
            name: e.name,
            total: 0,
            labor: 0,
            referrer: 0,
            count: 0
          };
        }
        commissionMap[e.id].labor += e.commission || 0;
        commissionMap[e.id].total += e.commission || 0;
        commissionMap[e.id].count += 1;
      });
    }
    // Referrer commission
    if (p.referrer && p.referrer.id) {
      if (!commissionMap[p.referrer.id]) {
        commissionMap[p.referrer.id] = {
          name: p.referrer.name,
          total: 0,
          labor: 0,
          referrer: 0,
          count: 0
        };
      }
      commissionMap[p.referrer.id].referrer += p.referrer.commission || 0;
      commissionMap[p.referrer.id].total += p.referrer.commission || 0;
      commissionMap[p.referrer.id].count += 1;
    }
  });

  // Filter by search
  const filtered = Object.entries(commissionMap)
    .filter(([_, v]) =>
      v.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b[1].total - a[1].total);

  // Stats
  const totalCommissions = filtered.reduce((sum, [_, v]) => sum + v.total, 0);

  return (
    <AppSidebar
      role={(localStorage.getItem("role") as "admin" | "cashier") || "cashier"}
      firstName={firstName}
      lastName={lastName}
      onLogout={onLogout}
      onProfile={onProfile}
    >
      <Box sx={{ maxWidth: 1000, mx: "auto", mt: 2, px: { xs: 1, sm: 2 }, pb: 6 }}>
        {/* Stats Section */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #1976d2", bgcolor: "background.paper"
          }}>
            <MonetizationOnIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Total Commissions</Typography>
              <Typography variant="h6" fontWeight={700}>{peso(totalCommissions)}</Typography>
            </Box>
          </Paper>
          <Paper elevation={3} sx={{
            flex: 1, minWidth: 180, p: 2, display: "flex", alignItems: "center", gap: 2,
            borderLeft: "5px solid #43a047", bgcolor: "background.paper"
          }}>
            <GroupIcon color="success" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Employees with Commissions</Typography>
              <Typography variant="h6" fontWeight={700}>{filtered.length}</Typography>
            </Box>
          </Paper>
        </Box>
        {/* Header Section */}
        <Paper sx={{
          p: { xs: 2, sm: 3 },
          mb: 3,
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          borderRadius: 3,
          boxShadow: 3,
          background: "linear-gradient(90deg, #f8fafc 60%, #e3f2fd 100%)"
        }}>
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700}>
              Employee Commissions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View all labor and referrer commissions earned by employees
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="From"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, background: "#f5f5f5" }
              }}
              sx={{ minWidth: 140 }}
            />
            <TextField
              size="small"
              placeholder="To"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, background: "#f5f5f5" }
              }}
              sx={{ minWidth: 140 }}
            />
            <TextField
              size="small"
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, background: "#f5f5f5" }
              }}
              sx={{ minWidth: 180 }}
            />
            <Button
              variant="outlined"
              color="primary"
              onClick={fetchAll}
              sx={{ borderRadius: 2, minWidth: 44, px: 2, py: 1 }}
              startIcon={<RefreshIcon />}
              disabled={refreshing}
            >
              Refresh
            </Button>
          </Box>
        </Paper>
        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Commission</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Labor Commission</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Referrer Commission</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>No. of Transactions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      No commissions found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(([empId, v]) => (
                  <TableRow key={empId}>
                    <TableCell>
                      <Typography fontWeight={600}>{v.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={peso(v.total)}
                        color="primary"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={peso(v.labor)}
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={peso(v.referrer)}
                        color="info"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>{v.count}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </AppSidebar>
  );
};

export default CommissionsPage;
