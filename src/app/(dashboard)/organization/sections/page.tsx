'use client';
import { useState, useEffect } from 'react';
import CrudPage, { FieldConfig } from '@/components/crud/CrudPage';
import api, { ApiResponse } from '@/lib/api';

export default function SectionsPage() {
  const [deptOptions, setDeptOptions] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    api.get<ApiResponse<{ id: number; nameEn: string }[]>>('/lookups/departments')
      .then((r) => setDeptOptions((r.data.data || []).map((d) => ({ value: d.id, label: d.nameEn }))));
  }, []);

  const fields: FieldConfig[] = [
    { key: 'sectionCode', label: 'Section Code', required: true, gridWidth: 120 },
    { key: 'nameEn', label: 'Name (English)', required: true, gridFlex: true },
    { key: 'nameAr', label: 'Name (Arabic)', gridFlex: true },
    { key: 'departmentId', label: 'Department', type: 'select', required: true, options: deptOptions, gridWidth: 160,
      renderCell: (_: unknown, row: Record<string, unknown>) => String((row).departmentName || '-') },
    { key: 'isActive', label: 'Active', type: 'switch' },
  ];

  return (
    <CrudPage
      title="Sections"
      entityName="Section"
      apiPath="/organization/sections"
      codeField="sectionCode"
      fields={fields}
    />
  );
}
