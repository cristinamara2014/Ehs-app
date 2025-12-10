import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLicense } from '@syncfusion/ej2-base';

// Register Syncfusion license
registerLicense('Ngo9BigBOggjHTQxAR8/V1JFaF1cXGFCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWH5cdHRQRGRcUUF1X0JWYEg=');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
