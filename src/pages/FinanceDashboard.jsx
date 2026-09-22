import { useState, useEffect } from 'react';
import { Income } from '@/entities/Income';
import { Expense } from '@/entities/Expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function FinanceDashboard() {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0
  });
  const [topIncomeSources, setTopIncomeSources] = useState([]);
  const [topExpenseCategories, setTopExpenseCategories] = useState([]);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      const currentMonthStart = startOfMonth(today);
      
      const [allIncomes, allExpenses] = await Promise.all([
        Income.list('-created_date'),
        Expense.list('-created_date')
      ]);

      // Stats for current month
      const currentMonthIncomes = allIncomes.filter(i => new Date(i.date_of_transaction || i.date) >= currentMonthStart);
      const currentMonthExpenses = allExpenses.filter(e => new Date(e.date_of_expense || e.date) >= currentMonthStart);
      
      const totalIncome = currentMonthIncomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const totalExpense = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      setStats({
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense
      });

      // Top 5 sources/categories
      setTopIncomeSources(calculateTopCategories(currentMonthIncomes, 'income_head_name'));
      setTopExpenseCategories(calculateTopCategories(currentMonthExpenses, 'expense_head_name'));

      // Monthly chart data for last 6 months
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(today, i);
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const monthIncome = allIncomes
          .filter(inc => new Date(inc.date_of_transaction || inc.date) >= monthStart && new Date(inc.date_of_transaction || inc.date) <= monthEnd)
          .reduce((sum, inc) => sum + Number(inc.amount || 0), 0);

        const monthExpense = allExpenses
          .filter(exp => new Date(exp.date_of_expense || exp.date) >= monthStart && new Date(exp.date_of_expense || exp.date) <= monthEnd)
          .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

        chartData.push({
          month: format(month, 'MMM'),
          Income: monthIncome,
          Expense: monthExpense
        });
      }
      setMonthlyChartData(chartData);

    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTopCategories = (data, categoryField) => {
    const categoryMap = data.reduce((acc, item) => {
      const category = item[categoryField] || item.income_head || item.expense_head || 'Other';
      acc[category] = (acc[category] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    return Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Finance Dashboard</h1>
          <p className="text-gray-500">An overview of your school's income and expenses for this month.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">₹{stats.totalIncome.toLocaleString()}</div>
            <p className="text-xs text-gray-500">This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">₹{stats.totalExpense.toLocaleString()}</div>
            <p className="text-xs text-gray-500">This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-blue-500' : 'text-yellow-500'}`}>
              ₹{stats.netBalance.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={topIncomeSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {topIncomeSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={topExpenseCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#FF8042" label>
                  {topExpenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.slice().reverse()[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Income vs Expense (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Income" fill="#00C49F" />
              <Bar dataKey="Expense" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}