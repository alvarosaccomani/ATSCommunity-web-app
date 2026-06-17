export interface SpaceInterface {
  cmp_uuid: string | null;
  sit_uuid: string | null;
  spa_uuid: string | null;
  spa_code: string | null;
  spa_name: string | null;
  spa_type: 'Reservable' | 'General';
  spa_capacity?: number | null;
  spa_cost?: number | null;
  spa_status: 'Active' | 'Maintenance' | 'Inactive';
  spa_createdat: Date | null;
  spa_updatedat: Date | null;
  site?: {
      sit_uuid: string;
      sit_name: string;
  };
}
