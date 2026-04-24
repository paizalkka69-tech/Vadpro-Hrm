'use client';
import CrudPage from '@/components/crud/CrudPage';

export default function BranchesPage() {
  return (
    <CrudPage
      title="Branches"
      entityName="Branch"
      apiPath="/organization/branches"
      fields={[
        { key: 'branchCode', label: 'Branch Code', required: true, gridWidth: 120 },
        { key: 'nameEn', label: 'Name (English)', required: true, gridFlex: true },
        { key: 'nameAr', label: 'Name (Arabic)', gridFlex: true },
        { key: 'city', label: 'City', gridWidth: 120 },
        { key: 'phone', label: 'Phone', gridWidth: 130 },
        { key: 'isActive', label: 'Active', type: 'switch' },
        { key: 'isHeadOffice', label: 'Head Office', type: 'switch' },
      ]}
    />
  );
}
