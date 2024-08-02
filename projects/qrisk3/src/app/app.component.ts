import {Component, Injector, OnDestroy, Signal} from '@angular/core';
import {SmartOnFhirService} from "smart-on-fhir";
import * as FHIR from 'fhirclient'
import Client from "fhirclient/lib/Client";
import {Subject} from "rxjs";
import {CdsDataService, StatefulCdsService} from "common";


@Component({
  selector: 'qrisk3-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent  implements OnDestroy {

  title: string = 'qrisk3'
  scores: number[] = [];
  error: string | undefined;
  patient: fhir4.Patient|undefined;

  age: number = 0;
  ageValid: number = 0;

  loadingPatientData: boolean = false;
  conceptDefinitions: { id: string, value: Signal<any>, [key: string]: any }[] = [];

  private client: Client|undefined;
  private destroy$: Subject<void> = new Subject();
  private stateChanged$: Subject<any> = new Subject();

  constructor(private sof: SmartOnFhirService, private qrisk3Service: CdsDataService,
              private injector: Injector, private statefulCdsService: StatefulCdsService) {
  }

  ngOnDestroy() {
    this.destroy$.next()
  }

  async ngOnInit() {
    this.client = await FHIR.oauth2.ready()
    this.loadingPatientData = true;
    this.patient = await this.sof.getPatient()
    this.age = (new Date().getFullYear()) - (new Date(<string>this.patient.birthDate).getFullYear())
    this.ageValid = (this.age < 85 && this.age > 24) ? 0 : (this.age < 25 ? 1 : 2)
    await this.qrisk3Service.init(this.client, this.patient, 'qrisk3')
    this.loadingPatientData = false
  }

  logout() {
    const launchUrl = <string>sessionStorage.getItem('launchUrl');
    sessionStorage.clear();
    window.location.href = launchUrl;
  }

}

