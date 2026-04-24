'use client';
import CrudPage from '@/components/crud/CrudPage';

export default function DesignationsPage() {
  return (
    <CrudPage
      title="Designations"
      entityName="Designation"
      apiPath="/organization/designations"
      codeField="desigCode"
      fields={[
        { key: 'desigCode', label: 'Desig Code', required: true, gridWidth: 120 },
        { key: 'nameEn', label: 'Name (English)', required: true, gridFlex: true },
        { key: 'nameAr', label: 'Name (Arabic)', gridFlex: true },
        { key: 'isActive', label: 'Active', type: 'switch' },
      ]}
    />
  );
}
