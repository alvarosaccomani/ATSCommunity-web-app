export interface SiteInterface {
  cmp_uuid: string | null;
  sit_uuid: string | null;
  sit_name: string | null;
  sit_address: string | null;
  sit_status: 'Activo' | 'Inactivo';
  sit_createdat: Date | null;
  sit_updatedat: Date | null
}
