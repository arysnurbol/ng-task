import { NgModule } from '@angular/core';
import { RouterModule, Routes} from "@angular/router";
import { SelectItemComponent } from './components/select-item/select-item.component';

const routes: Routes = [
  {
    path: 'select-item',
    component: SelectItemComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
