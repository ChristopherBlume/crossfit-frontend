import { Routes } from '@angular/router';
import { Documentation } from './_archiv/documentation/documentation';
import { Crud } from './_archiv/crud/crud';
import { Empty } from './_archiv/empty/empty';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
