import { Link, Outlet, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

function Layout() {
  const { pathname } = useLocation();
  return (
    <div>
      <AppBar position="sticky">
        <Tabs
          value={pathname}
          sx={{
            "& .Mui-selected": {
              color: "yellow !important",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "yellow !important",
            },
          }}
        >
          <Tab
            label="prisma-schema-form"
            component={Link}
            value="/"
            to="/"
            sx={{
              textTransform: "none",
              color: "white",
            }}
          />
          <Tab
            label="prisma-nest-dto"
            component={Link}
            value="/prisma-nest-dto"
            to="/prisma-nest-dto"
            sx={{
              textTransform: "none",
              color: "white",
            }}
          />
          <Tab
            label="rjsf-table"
            component={Link}
            value="/rjsf-table"
            to="/rjsf-table"
            sx={{
              textTransform: "none",
              color: "white",
            }}
          />
        </Tabs>
      </AppBar>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
