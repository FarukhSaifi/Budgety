import {
  Download as DownloadIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  TableChart as TableIcon,
} from "@mui/icons-material";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { useState } from "react";

export const Widget = ({
  title,
  children,
  actions,
  onExport,
  onRefresh,
  onViewDetails,
  onFilter,
  className = "",
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
    handleMenuClose();
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    handleMenuClose();
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    }
    handleMenuClose();
  };

  const handleFilter = () => {
    if (onFilter) {
      onFilter();
    }
    handleMenuClose();
  };

  // Default actions if none provided
  const defaultActions = (
    <>
      {onRefresh && (
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={handleRefresh}
            className="text-gray-600 hover:bg-gray-100"
          >
            <RefreshIcon className="h-[18px] w-[18px]" />
          </IconButton>
        </Tooltip>
      )}
      {onExport && (
        <Tooltip title="Export Data">
          <IconButton
            size="small"
            onClick={handleExport}
            className="text-gray-600 hover:bg-gray-100"
          >
            <DownloadIcon className="h-[18px] w-[18px]" />
          </IconButton>
        </Tooltip>
      )}
      {(onViewDetails || onFilter || onExport || onRefresh) && (
        <>
          <Tooltip title="More Options">
            <IconButton
              size="small"
              onClick={handleMenuClick}
              className="text-gray-600 hover:bg-gray-100"
            >
              <MoreIcon className="h-[18px] w-[18px]" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            {onViewDetails && (
              <MenuItem onClick={handleViewDetails}>
                <TableIcon className="mr-2 h-4 w-4" />
                View Details
              </MenuItem>
            )}
            {onFilter && (
              <MenuItem onClick={handleFilter}>
                <FilterIcon className="mr-2 h-4 w-4" />
                Filter
              </MenuItem>
            )}
            {onExport && (
              <MenuItem onClick={handleExport}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export Data
              </MenuItem>
            )}
            {onRefresh && (
              <MenuItem onClick={handleRefresh}>
                <RefreshIcon className="mr-2 h-4 w-4" />
                Refresh
              </MenuItem>
            )}
          </Menu>
        </>
      )}
    </>
  );

  return (
    <div
      className={`flex h-full flex-col rounded-card border border-gray-100 bg-white shadow-widget ${className}`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-2 md:px-4 py-2 md:py-4">
        <h6 className="text-base font-semibold text-gray-900">{title}</h6>
        <div className="flex gap-2">{actions || defaultActions}</div>
      </div>
      <div className="flex-1 p-2 md:p-4">{children}</div>
    </div>
  );
};
