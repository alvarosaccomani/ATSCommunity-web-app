import { Routes } from '@angular/router';

import { ApplicationLayoutComponent } from './application-layout/application-layout.component';
import { UnitsComponent } from './units/units.component';
import { ClaimsComponent } from './claims/claims.component';
import { FeesComponent } from './fees/fees.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { ChatComponent } from '../user/chat/chat.component';
import { TendersComponent } from '../user/tenders/tenders.component';
import { SettingsComponent } from './settings/settings.component';
import { SpacesComponent } from './spaces/spaces.component';

export const APPLICATION_ROUTES: Routes = [
    {
        path: '',
        component: ApplicationLayoutComponent,
        children: [
            { path: 'units', component: UnitsComponent},
            { path: 'claims', component: ClaimsComponent},
            { path: 'fees', component: FeesComponent},
            { path: 'transactions', component: TransactionsComponent},
            { path: 'chat', component: ChatComponent},
            { path: 'tenders', component: TendersComponent},
            { path: 'spaces', component: SpacesComponent},
            { path: 'settings', component: SettingsComponent}
        ]
    }
];