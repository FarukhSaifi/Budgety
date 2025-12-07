# Path Aliases

This project uses path aliases for cleaner and more maintainable imports. Instead of using relative paths like `../../../components/ui/Widget`, you can use clean aliases like `@ui/Widget`.

## Available Aliases

| Alias | Path | Usage |
|-------|------|-------|
| `@/` | `src/` | General source directory |
| `@ui/` | `src/components/ui/` | UI components |
| `@components/` | `src/components/` | All components |
| `@lib/` | `src/` | Library utilities (hooks, utils, constants) |
| `@hooks/` | `src/hooks/` | Custom React hooks |
| `@context/` | `src/context/` | React context providers |
| `@constants/` | `src/constants/` | Constants and configuration |
| `@utils/` | `src/utils/` | Utility functions |
| `@styles/` | `src/styles/` | Style files |
| `@theme/` | `src/theme/` | Theme configuration |

## Examples

### Before (Relative Imports)
```javascript
import { Widget } from "../../../components/ui/Widget";
import { useBudget } from "../../context/BudgetContext";
import { CURRENCY_SYMBOL } from "../../constants";
import { useBudgetCalculations } from "../../hooks/useBudgetCalculations";
```

### After (Path Aliases)
```javascript
import { Widget } from "@ui/Widget";
import { useBudget } from "@context/BudgetContext";
import { CURRENCY_SYMBOL } from "@constants";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
```

## Usage Examples

### UI Components
```javascript
import { Widget } from "@ui/Widget";
import { MetricCard } from "@ui/MetricCard";
import { EnhancedCard } from "@ui/EnhancedCard";
import { FormField } from "@ui/FormField";
```

### Context
```javascript
import { useBudget } from "@context/BudgetContext";
import { useTab } from "@context/TabContext";
```

### Hooks
```javascript
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useDateFormatter } from "@hooks/useDateFormatter";
```

### Constants
```javascript
import { CURRENCY_SYMBOL, TRANSACTION_TYPES } from "@constants";
```

### Components
```javascript
import Dashboard from "@components/Dashboard";
import Budget from "@components/Budget";
import AppLayout from "@components/layout/AppLayout";
```

### Theme
```javascript
import { theme } from "@theme";
```

## Configuration

Path aliases are configured in:
- **Vite**: `vite.config.js` - For build and dev server
- **IDE**: `jsconfig.json` - For IntelliSense and autocomplete

## Benefits

1. **Cleaner imports**: No more `../../../` paths
2. **Better refactoring**: Moving files doesn't break imports
3. **IDE support**: Better autocomplete and navigation
4. **Consistency**: Standardized import paths across the project
5. **Readability**: Easier to understand where imports come from

