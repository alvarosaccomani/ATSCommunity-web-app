import { Routes } from '@angular/router';

import { UserLayoutComponent } from './user-layout/user-layout.component';
import { MyUnitsComponent } from './my-units/my-units.component';
import { MyClaimsComponent } from './my-claims/my-claims.component';
import { MyFeesComponent } from './my-fees/my-fees.component';
import { MyTransactionsComponent } from './my-transactions/my-transactions.component';
import { MyNotificationsComponent } from './my-notifications/my-notifications.component';
import { ChatComponent } from './chat/chat.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { TendersComponent } from './tenders/tenders.component';

export const USER_ROUTES: Routes = [
    {
        path: '',
        component: UserLayoutComponent,
        children: [
            { path: 'my-units', component: MyUnitsComponent},
            { path: 'my-claims', component: MyClaimsComponent},
            { path: 'my-fees', component: MyFeesComponent},
            { path: 'my-transactions', component: MyTransactionsComponent},
            { path: 'my-notifications', component: MyNotificationsComponent},
            { path: 'my-chat', component: ChatComponent},
            { path: 'my-profile', component: MyProfileComponent},
            { path: 'my-tenders', component: TendersComponent}
        ]
    }
];