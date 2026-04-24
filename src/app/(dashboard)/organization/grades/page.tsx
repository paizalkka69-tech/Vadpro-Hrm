'use client';
import CrudPage from '@/components/crud/CrudPage';

export default function GradesPage() {
  return (
    <CrudPage
      title="Grades"
      entityName="Grade"
      apiPath="/organization/grades"
      codeField="gradeCode"
      fields={[
        { key: 'gradeCode', label: 'Grade Code', required: true, gridWidth: 120 },
        { key: 'nameEn', label: 'Name (English)', required: true, gridFlex: true },
        { key: 'nameAr', label: 'Name (Arabic)', gridFlex: true },
        { key: 'minSalary', label: 'Min Salary', type: 'number', gridWidth: 120 },
        { key: 'maxSalary', label: 'Max Salary', type: 'number', gridWidth: 120 },
        { key: 'isActive', label: 'Active', type: 'switch' },
      ]}
    />
  );
}
