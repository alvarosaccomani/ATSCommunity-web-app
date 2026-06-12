import { Routes } from '@angular/router';

import { UserLayoutComponent } from './user-layout/user-layout.component';
import { MyUnitsComponent } from './my-units/my-units.component';

export const USER_ROUTES: Routes = [
    {
        path: '',
        component: UserLayoutComponent,
        children: [
            { path: 'my-units', component: MyUnitsComponent},
        ]
    }
];