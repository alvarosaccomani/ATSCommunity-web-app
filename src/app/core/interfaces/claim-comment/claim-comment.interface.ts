// 1. Interfaz para tipar tus datos
export interface ClaimCommentInterface {
    cmp_uuid: string | null;
    cla_uuid: string | null;
    clac_uuid: string | null;
    usr_uuid: string | null;
    clac_text: string | null;
    clac_createdat: Date | null;
    usr?: {
        usr_uuid?: string;
        usr_name: string;
        usr_surname: string;
        usr_email: string;
    };
}