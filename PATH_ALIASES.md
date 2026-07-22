# Path Aliases

Prefer path aliases over deep relative imports.

## Available aliases

| Alias                        | Path                     |
| ---------------------------- | ------------------------ |
| `@/`                         | `src/`                   |
| `@components/`               | `src/components/`        |
| `@common` / `@common/`       | `src/components/common/` |
| `@hooks/`                    | `src/hooks/`             |
| `@context/`                  | `src/context/`           |
| `@constants` / `@constants/` | `src/constants/`         |
| `@utils` / `@utils/`         | `src/utils/`             |
| `@lib/`                      | `src/lib/`               |
| `@store` / `@store/`         | `src/store/`             |
| `@types` / `@types/`         | `src/types/`             |

## Examples

```ts
import { Button, Modal } from "@common";
import { useAppDispatch } from "@store/hooks";
import { UI_TEXT } from "@constants";
import { todayStorage } from "@utils/dateUtils";
import { HomeIcon } from "@components/icons";
```
