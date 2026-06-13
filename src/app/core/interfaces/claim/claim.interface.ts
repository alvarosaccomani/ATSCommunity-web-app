export interface ClaimInterface {
  cmp_uuid: string | null;
  cla_uuid: string | null;
  usr_uuid: string | null;
  uni_uuid: string | null;
  cla_title: string | null;
  cla_description: string | null;
  cla_type: 'Reclamo' | 'Sugerencia' | 'Propuesta';
  cla_status: 'Abierto' | 'En Licitacion' | 'Aprobado' | 'En Obra' | 'FinalizadoAprobado' | 'Rechazado';
  cla_priority?: 'Baja' | 'Media' | 'Alta';
  cla_createdat: Date | string | null;
  cla_updatedat: Date | string | null;
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
