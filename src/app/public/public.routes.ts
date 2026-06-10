import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './public-layout/public-layout.component';
import { HomeComponent } from './home/home.component';

export const PUBLIC_ROUTES: Routes = [
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            { path: 'home', component: HomeComponent }
        ]
    }
];