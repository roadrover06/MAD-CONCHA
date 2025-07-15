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
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import AppSidebar from "./AppSidebar";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
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
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { format } from "date-fns";
import { motion } from "framer-motion";
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

const SalesTransactionsPage: React.FC = () => {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Filters
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchPlate, setSearchPlate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "paid" | "unpaid">("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Dialog states
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidTargetId, setVoidTargetId] = useState<string | null>(null);

  // For delete feature
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAll, setDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // Handler to void a transaction (show confirmation dialog)
  const handleVoidTransaction = (id: string) => {
    setVoidTargetId(id);
    setVoidDialogOpen(true);
  };

  const confirmVoidTransaction = async () => {
    if (!voidTargetId) return;
    setVoidingId(voidTargetId);
    setVoidDialogOpen(false);
    try {
      await updateDoc(doc(db, "payments", voidTargetId), {
        voided: true,
        paid: false,
      });
      await fetchRecords();
    } catch (error) {
      alert("Failed to void transaction.");
    } finally {
      setVoidingId(null);
      setVoidTargetId(null);
    }
  };

  // Delete records (single or multiple)
  const handleDeleteRecords = (ids: string[], all: boolean = false) => {
    setSelectedIds(ids);
    setDeleteAll(all);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRecords = async () => {
    setDeleting(true);
    try {
      let idsToDelete: string[] = [];
      if (deleteAll) {
        // Change: Include voided records for "Delete all (filtered)"
        idsToDelete = filteredRecords.filter(r => r.id).map(r => r.id!) as string[];
      } else {
        idsToDelete = selectedIds;
      }
      for (const id of idsToDelete) {
        await deleteDoc(doc(db, "payments", id));
      }
      await fetchRecords();
      setSelectedIds([]);
    } catch (error) {
      alert("Failed to delete record(s).");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Filtered records
  const filteredRecords = records.filter(r => {
    const customerMatch = r.customerName.toLowerCase().includes(searchCustomer.toLowerCase());
    const plateMatch = r.plateNumber?.toLowerCase().includes(searchPlate.toLowerCase());
    const statusMatch =
      statusFilter === ""
        ? true
        : statusFilter === "paid"
        ? !!r.paid && !r.voided // Exclude voided from "paid" status
        : !r.paid && !r.voided; // Exclude voided from "unpaid" status
    const serviceMatch = serviceFilter ? r.serviceName === serviceFilter : true;
    const dateMatch = dateFilter
      ? format(new Date(r.createdAt), 'yyyy-MM-dd') === dateFilter
      : true;
    
    // Always show voided records unless a specific status filter hides them
    return customerMatch && plateMatch && serviceMatch && dateMatch && 
           (r.voided || statusMatch); // Keep voided records visible regardless of statusFilter, but allow other filters to apply.
  });

  // Checkbox selection logic
  // Change: Now allow selection of voided records for individual deletion
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Change: All selectable IDs now includes voided records
  const allSelectableIds = filteredRecords.filter(r => r.id).map(r => r.id!) as string[];
  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every(id => selectedIds.includes(id));

  // Quick stats
  const totalSales = records.filter(r => r.paid && !r.voided).reduce((sum, r) => sum + (typeof r.price === "number" ? r.price : 0), 0);
  const paidCount = records.filter(r => r.paid && !r.voided).length;
  const unpaidCount = records.filter(r => !r.paid && !r.voided).length;

  // Get role from localStorage (default to 'cashier' for backward compatibility)
  const role = (localStorage.getItem("role") as "admin" | "cashier") || "cashier";

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <AppSidebar role={role} onLogout={handleLogout}>
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredRecords.length} of {records.length} records
                </Typography>
                {/* Delete buttons for admin (moved here) */}
                {role === "admin" && (
                  <>
                    <Tooltip title="Delete selected">
                      <span>
                        <IconButton
                          color="error"
                          disabled={selectedIds.length === 0}
                          onClick={() => handleDeleteRecords(selectedIds)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Delete all (filtered)">
                      <span>
                        <IconButton
                          color="error"
                          disabled={allSelectableIds.length === 0}
                          onClick={() => handleDeleteRecords([], true)}
                        >
                          <DeleteIcon fontSize="small" />
                          <Typography variant="caption" sx={{ ml: 0.5 }}>All</Typography>
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {refreshing && <LinearProgress sx={{ mb: 2 }} />}

            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    {role === "admin" && (
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedIds(allSelectableIds);
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                          disabled={allSelectableIds.length === 0}
                        />
                      </TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Car Details</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Payment</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    {role === "admin" && (
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={role === "admin" ? 8 : 7} align="center" sx={{ py: 4 }}>
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
                          bgcolor: r.voided ? "error.lighter" : (r.paid ? "transparent" : "action.hover"),
                          opacity: r.voided ? 0.6 : 1,
                          textDecoration: r.voided ? "line-through" : "none"
                        }}
                      >
                        {role === "admin" && (
                          <TableCell padding="checkbox">
                            {/* Allow selection of voided records */}
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(r.id!)}
                              onChange={() => toggleSelect(r.id!)}
                            />
                          </TableCell>
                        )}
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
                          {r.voided ? (
                            <Chip label="Voided" color="error" size="small" />
                          ) : (
                            <Chip
                              label={r.paid ? "Paid" : "Unpaid"}
                              color={r.paid ? "success" : "warning"}
                              size="small"
                              variant={r.paid ? "filled" : "outlined"}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {r.paymentMethod ? (
                            <Chip
                              label={r.paymentMethod.charAt(0).toUpperCase() + r.paymentMethod.slice(1)}
                              size="small"
                              variant="outlined"
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography>
                            {format(new Date(r.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(r.createdAt), 'hh:mm a')}
                          </Typography>
                        </TableCell>
                        {role === "admin" && (
                          <TableCell>
                            {!r.voided ? (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                disabled={!!voidingId}
                                onClick={() => handleVoidTransaction(r.id!)}
                              >
                                {voidingId === r.id ? "Voiding..." : "Void"}
                              </Button>
                            ) : (
                              // Optional: Add a delete button for individual voided records here if needed
                              <Typography variant="caption" color="error">Voided</Typography>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Void Confirmation Dialog */}
            <Dialog open={voidDialogOpen} onClose={() => setVoidDialogOpen(false)}>
              <DialogTitle>Void Transaction</DialogTitle>
              <DialogContent>
                <Typography>
                  Are you sure you want to void this transaction? This action cannot be undone.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setVoidDialogOpen(false)}>Cancel</Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={confirmVoidTransaction}
                  disabled={!!voidingId}
                >
                  {voidingId === voidTargetId ? "Voiding..." : "Void"}
                </Button>
              </DialogActions>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
              <DialogTitle>Delete Transaction{deleteAll ? "s" : ""}</DialogTitle>
              <DialogContent>
                <Typography>
                  {deleteAll
                    ? `Are you sure you want to delete ALL transactions in the current filtered list, including voided ones? This cannot be undone.`
                    : `Are you sure you want to delete the selected transaction(s)? This cannot be undone.`}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={confirmDeleteRecords}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      </Box>
    </AppSidebar>
  );
};

export default SalesTransactionsPage;