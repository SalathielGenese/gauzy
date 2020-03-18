import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
	TimeLog,
	ITimerToggleInput,
	TimeLogType,
	TimerStatus
} from '@gauzy/models';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class TimeTrackerService {
	_dueration: BehaviorSubject<number>;
	_running: BehaviorSubject<boolean>;
	_timerConfig: BehaviorSubject<ITimerToggleInput>;
	dataStore: {
		dueration: number;
		running: boolean;
		timerConfig: ITimerToggleInput;
	};
	interval: any;

	constructor(private http: HttpClient) {
		this.dataStore = {
			dueration: 0,
			running: false,
			timerConfig: {
				isBillable: true,
				projectId: null,
				taskId: null,
				clientId: null,
				description: '',
				logType: TimeLogType.TRACKED,
				tags: []
			}
		};

		try {
			const config = localStorage.getItem('timerConfig');
			if (config) {
				this.dataStore.timerConfig = {
					...this.dataStore.timerConfig,
					...JSON.parse(config)
				};
			}
		} catch (error) {}

		this._dueration = new BehaviorSubject(this.dataStore.dueration);
		this._running = new BehaviorSubject(this.dataStore.running);
		this._timerConfig = new BehaviorSubject(this.dataStore.timerConfig);

		this.getTimerStatus().then((status: TimerStatus) => {
			this.dueration = status.duration;
			if (status.running) {
				this.turnOnTimer();
			}
		});
	}

	public get $dueration(): Observable<number> {
		return this._dueration.asObservable();
	}
	public get dueration(): number {
		return this.dataStore.dueration;
	}
	public set dueration(value: number) {
		this.dataStore.dueration = value;
		this._dueration.next(this.dataStore.dueration);
	}

	public get $timerConfig(): Observable<ITimerToggleInput> {
		return this._timerConfig.asObservable();
	}
	public get timerConfig(): ITimerToggleInput {
		return this.dataStore.timerConfig;
	}
	public set timerConfig(value: ITimerToggleInput) {
		this.dataStore.timerConfig = value;
		this._timerConfig.next(this.dataStore.timerConfig);
		localStorage.setItem(
			'timerConfig',
			JSON.stringify(this.dataStore.timerConfig)
		);
	}

	public get $running(): Observable<boolean> {
		return this._running.asObservable();
	}
	public get running(): boolean {
		return this.dataStore.running;
	}
	public set running(value: boolean) {
		this.dataStore.running = value;
		this._running.next(this.dataStore.running);
	}

	getTimerStatus(): Promise<TimerStatus> {
		return this.http
			.get<TimerStatus>('/api/timesheet/timer/status')
			.toPromise();
	}

	toggleTimer(request: ITimerToggleInput): Promise<TimeLog> {
		return this.http
			.post<TimeLog>('/api/timesheet/timer/toggle', request)
			.toPromise();
	}

	toggle() {
		if (this.interval) {
			this.turnOffTimer();
		} else {
			this.turnOnTimer();
		}

		this.toggleTimer(this.dataStore.timerConfig);
	}

	turnOnTimer() {
		this.running = true;
		this.interval = setInterval(() => {
			this.dueration++;
		}, 1000);
	}

	turnOffTimer() {
		this.running = false;
		clearInterval(this.interval);
		this.interval = null;
	}
}
