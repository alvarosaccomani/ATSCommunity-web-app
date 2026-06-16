export interface UnitInterface {
  cmp_uuid: string | null;
  uni_uuid: string | null;
  uni_code: string | null;
  uni_category: 'Residencial' | 'Comercial' | 'Socio Pleno' | 'Socio Deportivo' | 'Espacio Comun' | 'Parcela';
  uni_status: 'Activo' | 'Inactivo' | 'En_Mantenimiento';
  uni_financialcoefficient: number | null;
  uni_baseamountcustom: number | null;
  uni_locationdetails: string | null;
  uni_metadata?: Record<string, any> | null; // Campo dinámico para la flexibilidad genérica
  uni_istransferable: boolean | null;
  sit_uuid?: string | null;
  spa_uuid?: string | null;
  site?: { 
    sit_uuid: string; 
    sit_name: string
  } | null;
  space?: { 
    spa_uuid: string; 
    spa_name: string; 
    spa_type: string 
  } | null;
  uni_createdat: Date | null;
  uni_updatedat: Date | null
}
