// 1. Interfaz para tipar tus datos
export interface CompanyInterface {
    cmp_uuid: string | null;
    cmp_name: string | null;
    cmp_address: string | null;
    cmp_lat: number | null;
    cmp_lng: number | null;
    cmp_phone: string | null;
    cmp_email: string | null;
    cmp_slug: string | null;
    cmp_logo: string | null;
    cmp_banner: string | null;
    cmp_description: string | null;
    cmp_currency: string | null;
    cmp_whatsapp: string | null;
    cmp_instagram: string | null;
    cmp_facebook: string | null;
    cmp_allowbackorders: boolean | null;
    cmp_primarycolor: string | null;
    cmp_isfeatured: boolean | null;
    cmp_status: string | null;  //-- active, inactive, pending
    cmp_createdat: Date | null;
    cmp_updatedat: Date | null;
}