import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    imports: [],
    template: ` <div class="layout-footer">
        Crossfit Tracker by
        <a href="https://github.com/ChristopherBlume" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">CB</a>
    </div>`
})
export class AppFooter {}
