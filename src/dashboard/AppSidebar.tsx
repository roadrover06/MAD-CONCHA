import React, { useState, useEffect, ReactNode } from "react";
import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Divider,
  Typography,
  CssBaseline,
  ListItemButton,
  Menu,
  MenuItem as MuiMenuItem,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft,
  Dashboard,
  People,
  Settings,
  Receipt,
  BarChart,
  Logout,
  PointOfSale,
  AccountCircle,
  ExpandMore,
  Group as GroupIcon,
  Build as BuildIcon,
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon
} from "@mui/icons-material";
import logo from '../assets/logos/carwash-logo.png';
import { useNavigate } from "react-router-dom";

const drawerWidth = 240;
const collapsedWidth = 64;

interface AppSidebarProps {
  role: "admin" | "cashier";
  firstName?: string;
  lastName?: string;
  onLogout?: () => void;
  onProfile?: () => void;
  children?: ReactNode;
}

// Enhanced menu structure with route paths
const adminMenu = [
  {
    section: "Main",
    items: [
      { text: "Dashboard", icon: <Dashboard />, path: "/admin" },
      { text: "Reports & Analytics", icon: <BarChart />, path: "/admin/reports" },
      { text: "Sales Transactions", icon: <Receipt />, path: "/admin/sales-transactions" },
      { text: "Loyalty Program", icon: <People />, path: "/admin/loyalty-program" },
      { text: "Commissions", icon: <MonetizationOnIcon />, path: "/commissions" }
    ]
  },
  {
    section: "Management",
    items: [
      { text: "User Management", icon: <People />, path: "/admin/users" },
      { text: "Employee Management", icon: <GroupIcon />, path: "/admin/employees" },
      { text: "Service Management", icon: <BuildIcon />, path: "/admin/services" },
      { text: "Chemicals Inventory", icon: <BuildIcon color="secondary" />, path: "/admin/chemicals" }
    ]
  }
];

const cashierMenu = [
  {
    section: "Main",
    items: [
      { text: "Dashboard", icon: <Dashboard />, path: "/cashier" },
      { text: "Payment & Services", icon: <PaymentIcon />, path: "/cashier/payment-services" },
      { text: "Loyalty Program", icon: <People />, path: "/cashier/loyalty-program" },
      { text: "Sales Transactions", icon: <PointOfSale />, path: "/cashier/sales-transactions" },
      { text: "Daily Summary", icon: <Receipt />, path: "/cashier/daily-summary" },
      { text: "Commissions", icon: <MonetizationOnIcon />, path: "/commissions" }
    ]
  }
];

const SIDEBAR_PREF_KEY = "sidebarOpen";

const AppSidebar: React.FC<AppSidebarProps> = ({ 
  role, 
  firstName: propFirstName = '', 
  lastName: propLastName = '', 
  onLogout, 
  onProfile, 
  children 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(() => {
    const pref = localStorage.getItem(SIDEBAR_PREF_KEY);
    return pref === null ? true : pref === "true";
  });
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("");

  const [userInfo, setUserInfo] = useState<{firstName: string, lastName: string}>({
    firstName: propFirstName,
    lastName: propLastName
  });

  useEffect(() => {
    const stored = localStorage.getItem("userInfo");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserInfo({
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || ""
        });
      } catch {
        setUserInfo({ firstName: propFirstName, lastName: propLastName });
      }
    } else {
      setUserInfo({ firstName: propFirstName, lastName: propLastName });
    }
    
    // Set active item based on current path
    const currentPath = window.location.pathname;
    const allMenuItems = [...adminMenu, ...cashierMenu].flatMap(section => section.items);
    const activeMenuItem = allMenuItems.find(item => item.path === currentPath);
    if (activeMenuItem) {
      setActiveItem(activeMenuItem.text);
    }
  }, [propFirstName, propLastName, role]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_PREF_KEY, String(open));
  }, [open]);

  // Auto-close sidebar on mobile when clicking a menu item
  const handleMenuClick = (item: { text: string; path: string }) => {
    setActiveItem(item.text);
    navigate(item.path);
    if (isMobile) {
      setOpen(false);
    }
  };

  const menu = role === "admin" ? adminMenu : cashierMenu;
  const firstName = userInfo.firstName || propFirstName;
  const lastName = userInfo.lastName || propLastName;
  const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleProfileClick = () => {
    handleCloseMenu();
    if (onProfile) onProfile();
  };

  const handleLogoutClick = () => {
    handleCloseMenu();
    if (onLogout) onLogout();
  };

  const toggleSidebar = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      <CssBaseline />
      
      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            overflowX: 'hidden',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            background: "#fff",
            borderRight: "1px solid rgba(0, 0, 0, 0.12)",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          },
        }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: open ? "flex-start" : "center",
            p: open ? "20px 24px 12px 24px" : "20px 12px 12px 12px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            minHeight: 72
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Logo"
            sx={{
              height: 40,
              width: open ? "auto" : 40,
              borderRadius: 1,
              objectFit: "contain",
              transition: "width 0.3s"
            }}
          />
          {open && (
            <Typography variant="h6" sx={{ 
              ml: 2, 
              fontWeight: 700, 
              color: "primary.main", 
              letterSpacing: 1,
              whiteSpace: "nowrap"
            }}>
              MAD
            </Typography>
          )}
        </Box>

        {/* Main Menu */}
        <Box sx={{ 
          flexGrow: 1, 
          overflowY: "auto", 
          pt: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          }
        }}>
          {menu.map((section, idx) => (
            <Box key={`${section.section}-${idx}`}>
              {open && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    letterSpacing: 1,
                    pl: 3,
                    pt: idx === 0 ? 0 : 2,
                    pb: 0.5,
                    display: "block"
                  }}
                >
                  {section.section}
                </Typography>
              )}
              <List sx={{ py: 0 }}>
                {section.items.map((item) => (
                  <Tooltip 
                    key={item.text} 
                    title={!open ? item.text : ""} 
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                      sx={{
                        minHeight: 44,
                        justifyContent: open ? 'initial' : 'center',
                        px: open ? 3 : 1.5,
                        borderRadius: 1,
                        my: 0.5,
                        mx: 1,
                        transition: "all 0.2s",
                        backgroundColor: activeItem === item.text ? "primary.light" : "transparent",
                        "&:hover": {
                          backgroundColor: activeItem === item.text ? "primary.light" : "action.hover",
                        }
                      }}
                      onClick={() => handleMenuClick(item)}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2 : 'auto',
                          justifyContent: 'center',
                          color: activeItem === item.text ? "primary.main" : "action.active"
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        sx={{
                          opacity: open ? 1 : 0,
                          transition: "opacity 0.2s",
                          whiteSpace: "nowrap"
                        }}
                        primaryTypographyProps={{
                          fontWeight: 500,
                          fontSize: 14,
                          color: activeItem === item.text ? "primary.main" : "text.primary"
                        }}
                      />
                    </ListItemButton>
                  </Tooltip>
                ))}
              </List>
              {idx < menu.length - 1 && (
                <Divider sx={{ mx: open ? 2 : 1.5, my: 1 }} />
              )}
            </Box>
          ))}
        </Box>

        {/* User Menu Section */}
        <Box
          sx={{
            p: open ? 2 : 1,
            borderTop: "1px solid rgba(0, 0, 0, 0.12)",
            display: "flex",
            flexDirection: open ? "row" : "column",
            alignItems: "center",
            justifyContent: open ? "space-between" : "center",
            minHeight: 70,
            background: "background.paper"
          }}
        >
          <Tooltip title={`${firstName} ${lastName}`} placement="right" arrow>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: open ? "100%" : "auto",
                cursor: "pointer"
              }}
              onClick={handleUserMenuOpen}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  mr: open ? 2 : 0,
                }}
              >
                {userInitials}
              </Avatar>
              {open && (
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {firstName} {lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {role === "admin" ? "Admin" : "Cashier"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Tooltip>
          {open && (
            <IconButton 
              size="small" 
              onClick={handleUserMenuOpen} 
              sx={{ ml: 1 }}
              aria-label="User menu"
            >
              <ExpandMore />
            </IconButton>
          )}
        </Box>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 180,
              borderRadius: 2,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <MuiMenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MuiMenuItem>
          <Divider />
          <MuiMenuItem onClick={handleLogoutClick}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MuiMenuItem>
        </Menu>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: `calc(100% - ${open ? drawerWidth : collapsedWidth}px)`,
          transition: (theme) => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          background: "background.default",
          minHeight: "100vh",
          marginLeft: { xs: 0, sm: `${open ? drawerWidth : collapsedWidth}px` },
          position: "relative"
        }}
      >
        {/* Collapse Button */}
        <IconButton
          onClick={toggleSidebar}
          sx={{
            position: "fixed",
            top: 16,
            left: open ? drawerWidth - 12 : collapsedWidth - 12,
            zIndex: 1200,
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: 2,
            transition: "left 0.3s, transform 0.3s",
            "&:hover": {
              backgroundColor: "background.paper",
              transform: "scale(1.1)"
            },
            transform: open ? "rotate(0deg)" : "rotate(180deg)"
          }}
          size="medium"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronLeft />
        </IconButton>
        
        {children}
      </Box>
    </Box>
  );
};

export default AppSidebar;