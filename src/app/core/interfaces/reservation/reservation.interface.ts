export interface ReservationInterface {
  cmp_uuid: string | null;
  sit_uuid: string | null;
  spa_uuid: string | null;
  usr_uuid: string | null;
  res_uuid: string | null;
  res_date: Date | null;
  res_slot: string | null;
  res_status: 'Aprobada' | 'Pendiente' | 'Cancelada';
  res_createdat: Date | null;
  res_updatedat: Date | null;
  space?: {
      spa_uuid: string;
      spa_name: string;
      spa_type: string;
      spa_cost?: number | null;
      spa_capacity?: number | null;
      site?: {
          sit_uuid: string;
          sit_name: string;
      } | null;
  };
  usr?: {
      usr_uuid: string;
      usr_name: string;
      usr_surname: string;
      usr_email?: string;
  };
    
}
