import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainViewComponent } from './main-view/main-view.component';
import { BonusesComponent } from './bonuses/bonuses.component';
import { SettingsComponent } from './settings/settings.component';
import { LoginComponent } from './login/login.component';

import { AddLifeComponent } from './add-life/add-life.component';
import { AddAutoComponent } from './add-auto/add-auto.component';
import { AddBankComponent } from './add-bank/add-bank.component';
import { AddFireComponent } from './add-fire/add-fire.component';
import { AddHealthComponent } from './add-health/add-health.component';

import { AppsListComponent } from './apps-list/apps-list.component';
import { TimesheetComponent } from './timesheet/timesheet.component';
import { AddMutualFundComponent } from './add-mutual-fund/add-mutual-fund.component';

const routes: Routes = [
  // main pages
  { path: 'home', component: MainViewComponent },
  { path: 'bonuses', component: BonusesComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'timesheet', component: TimesheetComponent },

  // add app forms
  { path: 'add-life', component: AddLifeComponent },
  { path: 'add-auto', component: AddAutoComponent },
  { path: 'add-bank', component: AddBankComponent },
  { path: 'add-fire', component: AddFireComponent },
  { path: 'add-health', component: AddHealthComponent },
  { path: 'add-mutual-funds', component: AddMutualFundComponent },

  // edit app forms
  { path: 'life/:id', component: AddLifeComponent },
  { path: 'auto/:id', component: AddAutoComponent },
  { path: 'bank/:id', component: AddBankComponent },
  { path: 'fire/:id', component: AddFireComponent },
  { path: 'health/:id', component: AddHealthComponent },
  { path: 'mutual-funds/:id', component: AddMutualFundComponent },

  // app list pages
  { path: 'life', component: AppsListComponent },
  { path: 'auto', component: AppsListComponent },
  { path: 'bank', component: AppsListComponent },
  { path: 'fire', component: AppsListComponent },
  { path: 'health', component: AppsListComponent },
  { path: 'mutual-funds', component: AppsListComponent },

  // redirects anything that doesn't match any of above to home page
  { path: '**', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
