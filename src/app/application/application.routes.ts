import { Routes } from '@angular/router';

import { ApplicationLayoutComponent } from './application-layout/application-layout.component';
import { UnitsComponent } from './units/units.component';
import { ClaimsComponent } from './claims/claims.component';
import { FeesComponent } from './fees/fees.component';

export const APPLICATION_ROUTES: Routes = [
    {
        path: '',
        component: ApplicationLayoutComponent,
        children: [
            { path: 'units', component: UnitsComponent},
            { path: 'claims', component: ClaimsComponent},
            { path: 'fees', component: FeesComponent}
        ]
    }
];