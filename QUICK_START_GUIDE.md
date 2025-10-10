# Quick Start Guide - Budget Management System

## **Getting Started**

### **1. First Time Setup**

1. **Create Your Account:**
   - Navigate to `/auth`
   - Click "Sign Up" tab
   - Enter email and password (min 6 characters)
   - Account is auto-created with "viewer" role

2. **Promote to Admin:**
   - Option A: Have an existing admin promote you via `/admin/users`
   - Option B: Direct database update (first user):
   ```sql
   UPDATE user_roles 
   SET role = 'admin' 
   WHERE user_id = '<your-user-id>';
   ```

### **2. Understanding Roles**

| Role | Permissions |
|------|------------|
| **Viewer** | View dashboards, see masked budgets (variance only) |
| **Field Supervisor** | Viewer + scoped to specific rigs |
| **Analyst** | Viewer + upload data, manage master data |
| **Admin** | Full access + see raw budgets + manage users/budgets |

### **3. Budget System Overview**

#### **For Non-Admins:**
- See **variance signals** on KPI cards (e.g., "Within 5% of target")
- Color coded: 🟢 Good | 🟡 Warning | 🔴 Critical
- Direction indicators: ▲ Above | ▼ Below | ― On Target
- **Budget values are HIDDEN** for security

#### **For Admins:**
- See everything non-admins see PLUS
- **Raw budget values** displayed
- Access to Budget Management (`/admin/budgets`)
- Create/edit/approve/lock budget versions
- Manage user roles (`/admin/users`)

---

## **Admin Features**

### **Budget Management (`/admin/budgets`)**

**Budget Version Workflow:**
1. **Draft** → Create and edit budgets
2. **Submitted** → Ready for review
3. **Approved** → Reviewed and approved
4. **Locked** → Finalized, no more edits
5. **Archived** → Historical reference

**Version Features:**
- Multiple versions per fiscal year
- Version comparison (coming soon)
- Excel import/export (coming soon)
- Parent-child scenarios (coming soon)

### **User Management (`/admin/users`)**

**Managing Users:**
1. Go to `/admin/users`
2. See all users with current roles
3. Change role via dropdown
4. Changes apply immediately

**Role Assignment Best Practices:**
- Give minimum required permissions
- Regular viewers should stay as "viewer"
- Only promote trusted users to admin
- Field supervisors can be scoped to specific rigs

---

## **Using Budget Variance**

### **In Your React Components:**

```typescript
import { useBudgetVariance } from '@/hooks/useBudgetVariance';
import { VarianceChip } from '@/components/Budget/VarianceChip';

function MyKPI() {
  const { data: variance } = useBudgetVariance({
    report_key: 'revenue',
    rig_code: 'ADC-225',
    year: 2025,
    month: 1,
    metric_key: 'revenue_omr'
  });

  return (
    <div>
      <h3>Revenue: $4.2M</h3>
      {variance && (
        <VarianceChip
          status={variance.status}
          message={variance.message}
          direction={variance.direction}
        />
      )}
    </div>
  );
}
```

### **Or Use Pre-Built Component:**

```typescript
import { KPICardWithBudget } from '@/components/Dashboard/KPICardWithBudget';
import { DollarSign } from 'lucide-react';

function MyDashboard() {
  return (
    <KPICardWithBudget
      title="Total Revenue"
      value="$4.2M"
      icon={DollarSign}
      reportKey="revenue"
      rigCode="ADC-225"
      year={2025}
      month={1}
      metricKey="revenue_omr"
    />
  );
}
```

---

## **API Reference**

### **Edge Function: get-budget-variance**

**Endpoint:** `supabase.functions.invoke('get-budget-variance', { body: {...} })`

**Request:**
```typescript
{
  report_key: string;      // 'revenue', 'utilization', 'billing_npt', etc.
  rig_code?: string;       // Optional: filter by rig
  year: number;            // Fiscal year
  month?: number;          // 1-12, optional
  metric_key?: string;     // Optional: specific metric
  version_id?: string;     // Optional: specific version (defaults to active)
}
```

**Response (Non-Admin):**
```typescript
{
  actual: number | null;
  variance_pct: number | null;
  band: 'within_5' | 'within_10' | 'within_20' | 'above_20' | null;
  direction: 'above' | 'below' | 'on_target' | null;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  message: string;
}
```

**Response (Admin):**
```typescript
{
  // ... everything above PLUS:
  budget_value: number;
  currency: string;
}
```

---

## **Database Schema Reference**

### **Key Tables:**

| Table | Purpose |
|-------|---------|
| `user_roles` | User role assignments |
| `profiles` | User profile data |
| `budget_version` | Budget versions with approval workflow |
| `fact_budget` | Atomic monthly budget values |
| `budget_change_log` | Audit trail of all changes |
| `dim_rig` | Master rig list |
| `dim_report` | All 13 reports |
| `dim_metric` | Metrics per report |

### **Security Functions:**

| Function | Purpose |
|----------|---------|
| `has_role(user_id, role)` | Check if user has specific role |
| `get_user_roles(user_id)` | Get all roles for user |
| `can_access_rig(user_id, rig)` | Check rig access for field supervisors |

---

## **Common Tasks**

### **1. Add a New User**
1. User signs up at `/auth`
2. Admin goes to `/admin/users`
3. Admin changes role as needed

### **2. Create a Budget Version**
1. Go to `/admin/budgets`
2. Click "New Version"
3. Fill in version details
4. Status starts as "draft"

### **3. Integrate Variance into Dashboard**
```typescript
// Replace existing KPICard with:
import { KPICardWithBudget } from '@/components/Dashboard/KPICardWithBudget';

<KPICardWithBudget
  title="Your Metric"
  value={actualValue}
  icon={YourIcon}
  reportKey="your_report"
  year={currentYear}
  month={currentMonth}
  metricKey="your_metric"
/>
```

### **4. View Budget Variance**
- Non-admins: See colored chips on KPI cards
- Admins: See colored chips + raw budget value below

---

## **Troubleshooting**

### **Can't see budget variance?**
- Ensure budget version exists and is approved/locked
- Check that reportKey matches dim_report.report_key
- Verify year/month match budget data

### **Can't access admin pages?**
- Check your role: `SELECT * FROM user_roles WHERE user_id = auth.uid()`
- Must have 'admin' role to access `/admin/*`

### **Budget values showing for non-admins?**
- **This should NEVER happen** - report as security issue
- RLS policies should block all direct access

### **Can't log in?**
- Email confirmation is disabled (auto-confirm)
- Check password meets requirements (min 6 chars)
- Clear browser cache if stuck

---

## **Next Steps**

1. ✅ Sign up and get promoted to admin
2. ✅ Explore budget management UI
3. ✅ Try user role management
4. ✅ Integrate variance chips into dashboards
5. 🔄 Wait for budget editor (coming soon)
6. 🔄 Excel import/export (coming soon)

---

## **Support & Documentation**

- **Full Plan:** See `IMPLEMENTATION_SUMMARY.md`
- **Security:** All budget values masked for non-admins
- **Audit:** All changes logged in `budget_change_log`
- **Roles:** Managed via `/admin/users`

**Remember:** Budget management is admin-only. Regular users only see variance signals, never raw values.