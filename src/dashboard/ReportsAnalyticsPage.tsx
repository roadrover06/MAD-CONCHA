import React, { useEffect, useState, useRef } from "react";
import {
  Box, Typography, Paper, Button, MenuItem, Select, Divider, Stack,
  Card, CardContent, CircularProgress, Tooltip, IconButton
} from "@mui/material";
import { Assessment, GridOn, Download } from "@mui/icons-material";
import AppSidebar from "./AppSidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { motion } from "framer-motion";

const peso = (v: number) => `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const REPORT_TYPES = [
  { key: "sales", label: "Sales Report", icon: "📈" },
  { key: "services", label: "Services Availed", icon: "🚗" },
  { key: "chemicals", label: "Chemicals Usage", icon: "🧪" }
];

const SHOP_NAME = "MAD AUTO CARE SERVICES";

interface ReportData {
  salesByMonth: { [month: string]: number };
  serviceCount: { [serviceName: string]: number };
  chemicalUsage: { [chemical: string]: number };
}

export default function ReportsAnalyticsPage(props: any) {
  const { onLogout, onProfile, firstName, lastName } = props;
  const [payments, setPayments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [reportType, setReportType] = useState<"sales" | "services" | "chemicals">("sales");
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [paymentsSnap, servicesSnap, chemicalsSnap] = await Promise.all([
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "services")),
        getDocs(collection(db, "chemicals"))
      ]);
      setPayments(paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setChemicals(chemicalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Data processing
  const now = new Date();
  const generatedDate = now.toLocaleString();

  // Process data for reports
  const processReportData = (): ReportData => {
    const paidPayments = payments.filter(p => p.paid);
    
    // Sales by month
    const salesByMonth: { [month: string]: number } = {};
    paidPayments.forEach(p => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      salesByMonth[key] = (salesByMonth[key] || 0) + (typeof p.price === "number" ? p.price : 0);
    });

    // Services availed
    const serviceCount: { [serviceName: string]: number } = {};
    paidPayments.forEach(p => {
      if (p.serviceName) {
        serviceCount[p.serviceName] = (serviceCount[p.serviceName] || 0) + 1;
      }
    });

    // Chemicals usage
    const chemicalUsage: { [chemical: string]: number } = {};
    paidPayments.forEach(p => {
      const service = services.find((s: any) => s.id === p.serviceId);
      if (service && service.chemicals) {
        Object.entries(service.chemicals).forEach(([chemId, chem]) => {
          const c = chem as { usage?: { [variety: string]: number }; name: string };
          const usage = c.usage?.[p.variety] || 0;
          const chemName = c.name;
          chemicalUsage[chemName] = (chemicalUsage[chemName] || 0) + usage;
        });
      }
    });

    return { salesByMonth, serviceCount, chemicalUsage };
  };

  const { salesByMonth, serviceCount, chemicalUsage } = processReportData();

  const chartTitle = REPORT_TYPES.find(t => t.key === reportType)?.label || "Report";

  // Generate Excel report (dynamic import)
  const generateExcel = async () => {
    // @ts-ignore
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    let data: any[][] = [];
    let headers: string[] = [];
    
    if (reportType === "sales") {
      headers = ["Month", "Sales"];
      data = Object.entries(salesByMonth).map(([month, sales]) => [month, sales]);
    } else if (reportType === "services") {
      headers = ["Service", "Times Availed"];
      data = Object.entries(serviceCount).map(([service, count]) => [service, count]);
    } else if (reportType === "chemicals") {
      headers = ["Chemical", "Total Usage (ml)"];
      data = Object.entries(chemicalUsage).map(([chem, usage]) => [chem, usage]);
    }
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, chartTitle);
    XLSX.writeFile(wb, `${chartTitle.replace(/\s+/g, '_')}_${now.getTime()}.xlsx`);
  };

  // Print handler
  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${SHOP_NAME} - ${chartTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 20px; }
            .shop-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .report-title { font-size: 18px; margin-bottom: 5px; }
            .generated { font-size: 14px; color: #555; margin-bottom: 15px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
            th { background-color: #2980b9; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f5f5f5; }
            .footer { margin-top: 30px; text-align: right; font-size: 14px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="shop-title">${SHOP_NAME}</div>
            <div class="report-title">${chartTitle}</div>
            <div class="generated">Generated: ${generatedDate}</div>
          </div>
          ${getPrintableTable()}
          <div class="footer">Page 1</div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  function getPrintableTable() {
    if (reportType === "sales") {
      return `
        <table>
          <thead>
            <tr><th>Month</th><th>Sales</th></tr>
          </thead>
          <tbody>
            ${Object.entries(salesByMonth)
              .map(([month, sales]) => `<tr><td>${month}</td><td>${peso(sales)}</td></tr>`)
              .join("")}
          </tbody>
        </table>
      `;
    }
    if (reportType === "services") {
      return `
        <table>
          <thead>
            <tr><th>Service</th><th>Times Availed</th></tr>
          </thead>
          <tbody>
            ${Object.entries(serviceCount)
              .map(([service, count]) => `<tr><td>${service}</td><td>${count}</td></tr>`)
              .join("")}
          </tbody>
        </table>
      `;
    }
    if (reportType === "chemicals") {
      return `
        <table>
          <thead>
            <tr><th>Chemical</th><th>Total Usage (ml)</th></tr>
          </thead>
          <tbody>
            ${Object.entries(chemicalUsage)
              .map(([chem, usage]) => `<tr><td>${chem}</td><td>${usage}</td></tr>`)
              .join("")}
          </tbody>
        </table>
      `;
    }
    return "";
  }

  return (
    <AppSidebar
      role="admin"
      onLogout={onLogout}
      onProfile={onProfile}
      firstName={firstName}
      lastName={lastName}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 3 } }}>
        {/* Header Section */}
        <Paper 
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)'
          }}
        >
          {/* Replace Grid with Box/Stack for layout */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              gap: 2
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ mr: 1.5, fontSize: 32 }} />
                Reports & Analytics
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Generate detailed reports for business insights
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: { xs: "flex-start", md: "flex-end" },
                alignItems: "center"
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  size="small"
                  sx={{ minWidth: 200, background: 'white' }}
                >
                  {REPORT_TYPES.map(t => (
                    <MenuItem key={t.key} value={t.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{t.icon}</span>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Download />}
                  onClick={handlePrint}
                  sx={{ textTransform: 'none' }}
                >
                  Print
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>

        {/* Export Buttons */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Tooltip title="Export to Excel">
            <IconButton
              onClick={generateExcel}
              color="success"
              sx={{ 
                bgcolor: 'success.light', 
                '&:hover': { bgcolor: 'success.main', color: 'white' } 
              }}
            >
              <GridOn />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Report Content */}
        <Box ref={printRef}>
          <Card 
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            sx={{ 
              borderRadius: 3,
              boxShadow: 3,
              mb: 3
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Report Header */}
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                  {SHOP_NAME}
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {chartTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generated: {generatedDate}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />

              {/* Report Content */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {reportType === "sales" && (
                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        Monthly Sales Report
                      </Typography>
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={{ 
                                border: "1px solid #ddd", 
                                padding: 12,
                                backgroundColor: '#2980b9',
                                color: 'white',
                                textAlign: 'left'
                              }}>
                                Month
                              </th>
                              <th style={{ 
                                border: "1px solid #ddd", 
                                padding: 12,
                                backgroundColor: '#2980b9',
                                color: 'white',
                                textAlign: 'left'
                              }}>
                                Sales
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(salesByMonth).map(([month, sales]) => (
                              <tr key={month} style={{ backgroundColor: '#fff' }}>
                                <td style={{ 
                                  border: "1px solid #ddd", 
                                  padding: 12,
                                  textAlign: 'left'
                                }}>
                                  {month}
                                </td>
                                <td style={{ 
                                  border: "1px solid #ddd", 
                                  padding: 12,
                                  textAlign: 'left'
                                }}>
                                  {peso(sales)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  )}

                  {reportType === "services" && (
                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        Services Availed Report
                      </Typography>
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={{ 
                                border: "1px solid #ddd", 
                                padding: 12,
                                backgroundColor: '#2980b9',
                                color: 'white',
                                textAlign: 'left'
                              }}>
                                Service
                              </th>
                              <th style={{ 
                                border: "1px solid #ddd", 
                                padding: 12,
                                backgroundColor: '#2980b9',
                                color: 'white',
                                textAlign: 'left'
                              }}>
                                Times Availed
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(serviceCount).map(([service, count]) => (
                              <tr key={service} style={{ backgroundColor: '#fff' }}>
                                <td style={{ 
                                  border: "1px solid #ddd", 
                                  padding: 12,
                                  textAlign: 'left'
                                }}>
                                  {service}
                                </td>
                                <td style={{ 
                                  border: "1px solid #ddd", 
                                  padding: 12,
                                  textAlign: 'left'
                                }}>
                                  {count}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  )}

                  {reportType === "chemicals" && (
                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        Chemicals Usage Report
                      </Typography>
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={{ 
                                border: "1px solid #ddd", 
                                padding: 12,
                                backgroundColor: '#2980b9',
                                color: 'white',
                                textAlign: 'left'
                              }}>
                                Chemical
                              </th>
                              <th style={{ 
                                border: "1px solid #ddd", 
                                padding: 12,
                                backgroundColor: '#2980b9',
                                color: 'white',
                                textAlign: 'left'
                              }}>
                                Total Usage (ml)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(chemicalUsage).map(([chem, usage]) => (
                              <tr key={chem} style={{ backgroundColor: '#fff' }}>
                                <td style={{ 
                                  border: "1px solid #ddd", 
                                  padding: 12,
                                  textAlign: 'left'
                                }}>
                                  {chem}
                                </td>
                                <td style={{ 
                                  border: "1px solid #ddd", 
                                  padding: 12,
                                  textAlign: 'left'
                                }}>
                                  {usage}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  )}
                </>
              )}

              <Divider sx={{ mt: 3, mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                Page 1
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </AppSidebar>
  );
}