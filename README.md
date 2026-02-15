# Budgety 💰

A comprehensive personal budget management application built with React. Track your income, expenses, budgets, bills, and savings goals all in one place.

**Live Demo:** [[https://FarukhSaifi.github.io/Budgety](https://FarukhSaifi.github.io/Budgety)](https://budgety-woad.vercel.app/)

## ✨ Features

### 📊 Dashboard

- **Financial Overview**: Real-time summary of income, expenses, and net savings
- **Category Breakdown**: Visual charts showing spending by category
- **Monthly Trends**: Track your financial trends over time
- **Recent Transactions**: Quick access to your latest transactions

### 💳 Transactions Management

- **Add Transactions**: Record income and expenses with detailed information
- **Multiple Payment Modes**: Support for Cash, Card, UPI, Net Banking, and more
- **Categorization**: Organize transactions by income/expense categories
- **List & Calendar Views**: Switch between list and calendar views
- **Search & Filter**: Find transactions quickly with search and category filters
- **Edit & Delete**: Update or remove transactions as needed

### 📥 Bank Statement Import

- **CSV/Excel Support**: Import transactions from bank statements
- **Automatic Parsing**: Smart detection of transaction details
- **Category Detection**: Automatic categorization based on transaction descriptions
- **Duplicate Detection**: Prevents importing duplicate transactions
- **Bulk Operations**: Manage imported transactions efficiently

### 💵 Budget Management

- **Category Budgets**: Set spending limits for different categories
- **Budget Tracking**: Monitor spending against budget limits
- **Visual Indicators**: Color-coded warnings for over-budget categories
- **Monthly & Yearly Views**: Track budgets across different time periods

### 📅 Bills & Recurring Transactions

- **Bill Reminders**: Never miss a payment with bill reminders
- **Recurring Transactions**: Automatically track recurring income/expenses
- **Payment Calendar**: Visual calendar view of upcoming payments
- **Due Date Tracking**: Get notified about upcoming and overdue bills
- **Multiple Recurrence Types**: Daily, weekly, monthly, and yearly

### 📈 Reports & Analysis

- **Comprehensive Reports**: Detailed financial analysis and insights
- **Spending Trends**: Analyze your spending patterns over time
- **Category Analysis**: Deep dive into spending by category
- **Budget vs Actual**: Compare planned budgets with actual spending
- **Expense Forecast**: Predict future expenses based on historical data

### 🎯 Savings Goals

- **Goal Tracking**: Set and track multiple savings goals
- **Progress Visualization**: Visual progress indicators for each goal
- **Target Management**: Set target amounts and track current progress
- **Goal Achievement**: Celebrate when you reach your goals!

## 🛠️ Tech Stack

- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 6.3.4
- **UI Library**: Material-UI (MUI) 7.3.5
- **Styling**: Tailwind CSS 3.4.0
- **Charts**: Recharts 3.5.0
- **Date Handling**: Day.js 1.11.19
- **File Processing**: XLSX 0.18.5
- **Notifications**: React Toastify 11.0.5
- **State Management**: React Context API
- **Code Quality**: ESLint 9.39.1

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/farukh1x95/Budgety.git
   cd Budgety
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   # or
   npm run dev
   ```

4. **Open your browser** Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

The production build will be created in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
Budgety/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── features/      # Feature-specific components
│   │   │   ├── bills/     # Bill management components
│   │   │   ├── budgets/   # Budget management components
│   │   │   ├── dashboard/ # Dashboard components
│   │   │   ├── goals/     # Savings goals components
│   │   │   ├── reports/   # Reports & analysis components
│   │   │   └── transactions/ # Transaction components
│   │   ├── layout/        # Layout components (Header, Sidebar, etc.)
│   │   └── ui/            # Reusable UI components
│   ├── constants/         # Application constants
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── styles/            # Styling files
│   ├── theme/             # Theme configuration
│   ├── types/             # Type definitions
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main App component
│   └── index.jsx          # Application entry point
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json           # Project dependencies
```

## 🎨 Key Features & Design Patterns

- **Path Aliases**: Clean imports using `@components`, `@utils`, `@constants`, etc.
- **Code Splitting**: Lazy loading for optimal performance
- **Context API**: Centralized state management with BudgetContext and TabContext
- **Custom Hooks**: Reusable hooks for currency formatting, date formatting, and budget calculations
- **Component Reusability**: Modular, reusable UI components
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Error Handling**: Proper error boundaries and user-friendly error messages
- **Constants Management**: All static values centralized in constants file

## 📝 Available Scripts

- `npm start` / `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run lint:strict` - Run ESLint with zero warnings tolerance
- `npm run deploy` - Deploy to GitHub Pages

## 🔧 Configuration

### Path Aliases

The project uses path aliases for cleaner imports:

- `@components` → `src/components`
- `@utils` → `src/utils`
- `@constants` → `src/constants`
- `@hooks` → `src/hooks`
- `@context` → `src/context`
- `@styles` → `src/styles`
- `@theme` → `src/theme`

### Environment Variables

Currently, the application uses local storage for data persistence. No environment variables are required for basic functionality.

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👤 Author

**Farukh Saifi**

- GitHub: [@farukh1x95](https://github.com/farukh1x95)
- Live Demo: [Budgety](https://farukh1x95.github.io/Budgety)

## 🙏 Acknowledgments

- Material-UI for the excellent component library
- Recharts for beautiful chart visualizations
- Vite for the fast build tooling
- All contributors and users of this project

---

Made with ❤️ using React
