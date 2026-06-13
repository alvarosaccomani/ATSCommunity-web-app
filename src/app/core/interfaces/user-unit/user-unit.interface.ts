import { UnitInterface } from '../unit/unit.interface';

export interface UserUnitInterface {
  cmp_uuid: string | null,
  usr_uuid: string | null,
  uni_uuid: string | null,
  usruni_uuid: string | null,
  usruni_relationtype: 'Propietario' | 'Copropietario' | 'Inquilino' | 'Socio Principal';
  usruni_isactive: boolean | null,
  usruni_startdate: Date | null,
  usruni_enddate: Date | null,
  usruni_createdat: Date | null,
  usruni_updatedat: Date | null,
  usr?: {
    usr_uuid: string;
    usr_name: string;
    usr_surname: string;
    usr_nick: string;
    usr_email: string;
  };
  unit?: UnitInterface;
}

