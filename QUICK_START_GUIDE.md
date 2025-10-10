# Quick Start Guide - Complete Budget Management System

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
- Advanced analytics (`/admin/analytics`)

---

## **Admin Features**

### **Budget Management (`/admin/budgets`)**

**Budget Version Workflow:**
1. **Draft** → Create and edit budgets
2. **Submitted** → Ready for review
3. **Approved** → Reviewed and approved
4. **Locked** → Finalized, no more edits
5. **Archived** → Historical reference

**Key Features:**
- ✅ Excel-like grid editor for budget entry
- ✅ Download budget templates
- ✅ Upload Excel files with validation
- ✅ Export budgets to Excel
- ✅ Multiple versions per fiscal year
- ✅ Version comparison

### **Budget Analytics (`/admin/analytics`)**

**Health Score Dashboard:**
- Overall budget health grade (A-F)
- Weighted scoring system
- Breakdown by Good/Warning/Critical
- Average variance tracking

**Variance Trends:**
- Line charts showing variance over time
- Reference lines for thresholds
- Visual performance indicators

**Version Comparison:**
- Side-by-side version comparison
- Difference calculations
- Change percentage indicators

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

## **Using Budget Features**

### **1. Creating a Budget Version**
1. Go to `/admin/budgets`
2. Click "New Version" (coming soon - currently via database)
3. Fill in version details
4. Status starts as "draft"

### **2. Editing Budget Values**
1. Go to `/admin/budgets`
2. Click "Edit" on a version
3. Use the grid editor to enter values
4. Values are organized by: Rig → Metric → Month
5. Click "Save Changes" when done

### **3. Importing from Excel**
1. Go to `/admin/budgets`
2. Click "Template" to download the Excel template
3. Fill in the template with your budget data
4. Click "Import" on a version
5. Upload the filled Excel file
6. System validates and imports the data

### **4. Exporting to Excel**
1. Go to `/admin/budgets`
2. Select report type and year
3. Click "Export" on a version
4. Excel file downloads automatically

### **5. Viewing Analytics**
1. Go to `/admin/analytics`
2. Select report type and year
3. Switch between tabs:
   - **Health Score**: Overall budget performance
   - **Trends**: Variance over time
   - **Comparison**: Compare two budget versions

### **6. Checking Budget Alerts**
- Call the edge function: `check-budget-alerts`
- Returns list of variances exceeding thresholds
- Can be scheduled via cron jobs (future)

---

## **Using Budget Variance in Dashboards**

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

### **Edge Function: check-budget-alerts**

**Endpoint:** `supabase.functions.invoke('check-budget-alerts')`

**Response:**
```typescript
{
  success: boolean;
  alerts: Array<{
    report_key: string;
    report_name: string;
    rig_code: string;
    metric_key: string;
    metric_name: string;
    year: number;
    month: number;
    budget: number;
    actual: number;
    variance_pct: number;
    severity: 'warning' | 'critical';
    timestamp: string;
  }>;
  count: number;
  checked_at: string;
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

### **Excel import fails?**
- Verify template format matches downloaded template
- Check that rig codes and metric keys exist in database
- Ensure numeric values are valid

---

## **Complete Feature List**

### **✅ Phase 11: Authentication & RBAC**
- User authentication with signup/login
- 4 role types (admin, analyst, field_supervisor, viewer)
- Protected routes with role checking
- User management UI

### **✅ Phase 12: Budget Editor**
- Grid-based budget editor
- Edit by rig, metric, and month
- Real-time updates
- Multi-metric support

### **✅ Phase 13: Excel Import/Export**
- Download budget templates
- Upload Excel with validation
- Bulk import/export
- Data mapping and validation

### **✅ Phase 14: Dashboard Integration**
- Budget variance on KPI cards
- Color-coded status indicators
- Admin-only raw values
- Non-admin variance signals

### **✅ Phase 15: Advanced Analytics**
- Budget health score with grades
- Variance trend charts
- Multi-version comparison
- Automated alert checking

---

## **Next Steps**

1. ✅ Sign up and get promoted to admin
2. ✅ Explore budget management UI
3. ✅ Try user role management
4. ✅ Create or import budget versions
5. ✅ Edit budget values in grid editor
6. ✅ View budget analytics
7. ✅ Integrate variance chips into dashboards

---

## **Support & Documentation**

- **Full Plan:** See `IMPLEMENTATION_SUMMARY.md`
- **Security:** All budget values masked for non-admins
- **Audit:** All changes logged in `budget_change_log`
- **Roles:** Managed via `/admin/users`
- **Analytics:** Available at `/admin/analytics`

**Remember:** Budget management is admin-only. Regular users only see variance signals, never raw values.
