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
  { path: '', component: MainViewComponent },
  { path: 'home', component: MainViewComponent },
  { path: 'home/:year', component: MainViewComponent },
  { path: 'bonuses/:year', component: BonusesComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'timesheet/:year', component: TimesheetComponent },

  // add app forms
  { path: 'add-life', component: AddLifeComponent },
  { path: 'add-auto', component: AddAutoComponent },
  { path: 'add-bank', component: AddBankComponent },
  { path: 'add-fire', component: AddFireComponent },
  { path: 'add-health', component: AddHealthComponent },
  { path: 'add-mutual-funds', component: AddMutualFundComponent },

  // edit app forms
  { path: 'life/:year/:id', component: AddLifeComponent },
  { path: 'auto/:year/:id', component: AddAutoComponent },
  { path: 'bank/:year/:id', component: AddBankComponent },
  { path: 'fire/:year/:id', component: AddFireComponent },
  { path: 'health/:year/:id', component: AddHealthComponent },
  { path: 'mutual-funds/:year/:id', component: AddMutualFundComponent },

  // app list pages
  { path: 'life/:year', component: AppsListComponent },
  { path: 'auto/:year', component: AppsListComponent },
  { path: 'bank/:year', component: AppsListComponent },
  { path: 'fire/:year', component: AppsListComponent },
  { path: 'health/:year', component: AppsListComponent },
  { path: 'mutual-funds/:year', component: AppsListComponent },

  // redirects anything that doesn't match any of above to home page
  { path: '**', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
