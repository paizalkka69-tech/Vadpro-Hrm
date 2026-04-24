'use client';
import CrudPage from '@/components/crud/CrudPage';

export default function DepartmentsPage() {
  return (
    <CrudPage
      title="Departments"
      entityName="Department"
      apiPath="/organization/departments"
      fields={[
        { key: 'deptCode', label: 'Dept Code', required: true, gridWidth: 120 },
        { key: 'nameEn', label: 'Name (English)', required: true, gridFlex: true },
        { key: 'nameAr', label: 'Name (Arabic)', gridFlex: true },
        { key: 'isActive', label: 'Active', type: 'switch' },
      ]}
    />
  );
}
