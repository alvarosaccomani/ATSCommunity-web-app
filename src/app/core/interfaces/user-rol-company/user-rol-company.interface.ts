import { CompanyInterface } from "../company"
import { RolInterface } from "../rol"
import { UserInterface } from "../user/user.interface"

export interface UserRolCompanyInterface {
    cmp_uuid: string | null,
    cmp: CompanyInterface | null,
    usr_uuid: string | null,
    usr: UserInterface | null,
    rol_uuid: string | null,
    rol: RolInterface | null,
    usrrolcmp_createdat: Date | null,
    usrrolcmp_updatedat: Date | null
}