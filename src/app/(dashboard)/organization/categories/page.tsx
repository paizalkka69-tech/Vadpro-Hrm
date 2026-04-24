'use client';
import CrudPage from '@/components/crud/CrudPage';

export default function CategoriesPage() {
  return (
    <CrudPage
      title="Employee Categories"
      entityName="Category"
      apiPath="/organization/categories"
      codeField="categoryCode"
      fields={[
        { key: 'categoryCode', label: 'Category Code', required: true, gridWidth: 120 },
        { key: 'nameEn', label: 'Name (English)', required: true, gridFlex: true },
        { key: 'nameAr', label: 'Name (Arabic)', gridFlex: true },
        { key: 'isActive', label: 'Active', type: 'switch' },
      ]}
    />
  );
}
