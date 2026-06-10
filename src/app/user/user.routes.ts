import { Routes } from '@angular/router';

import { UserLayoutComponent } from './user-layout/user-layout.component';

export const USER_ROUTES: Routes = [
    {
        path: '',
        component: UserLayoutComponent,
        children: []
    }
];