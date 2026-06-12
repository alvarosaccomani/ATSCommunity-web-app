export interface TransactionInterface {
  cmp_uuid: string | null;
  usr_uuid: string | null;
  uni_uuid: string | null;
  usruni_uuid: string | null;
  fee_uuid: string | null;
  tra_uuid: string | null;
  tra_gatewayid: string | null;
  tra_totalamount: number | null;
  tra_platformfee: number | null;
  tra_recipientamount: number | null;
  tra_status: 'Approved' | 'Pending' | 'Rejected';
  tra_createdat: Date | string | null;
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
  fee?: {
    fee_uuid: string;
    fee_period: string;
    fee_amount: number;
  };
}
