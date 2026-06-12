export interface FeeInterface {
  cmp_uuid: string | null;
  usr_uuid: string | null;
  uni_uuid: string | null;
  usruni_uuid: string | null;
  fee_uuid: string | null;
  fee_period: string | null;
  fee_amount: number | null;
  fee_duedate: Date | string | null;
  fee_status: 'Pendiente' | 'Pagada' | 'Vencida';
  fee_createdat: Date | string | null;
  usr?: {
    usr_uuid: string;
    usr_name: string;
    usr_surname: string;
    usr_email: string;
  };
  unit?: {
    uni_uuid: string;
    uni_code: string;
    uni_category: string;
  };
}
