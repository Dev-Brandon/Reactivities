import {observable, action, computed, configure, runInAction} from 'mobx'
import { createContext, SyntheticEvent } from 'react';
import { IActivity } from '../models/activity';
import agent from '../api/agent';

configure({enforceActions: 'always'});

class ActivityStore {
    @observable activityRegistry = new Map<string, IActivity>();
    @observable activities: IActivity[] = [];
    @observable selectedActivity: IActivity | undefined;
    @observable loadingInitial = false;
    @observable editMode = false;
    @observable submitting = false;
    @observable target = '';

    // use computed when you already have props in store
    // but you need to workout the results of the data
    @computed get activitiesByDate() {
        return Array.from(this.activityRegistry.values())
            .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    }

    @action loadActivities = async () => {
        this.loadingInitial = true;
        try {
            const activities = await agent.Activities.list();
            runInAction(() => {
                activities.forEach(activity => {
                    activity.date = activity.date.split('.')[0];
                    this.activityRegistry.set(activity.id, activity)
                });
            });     
            this.loadingInitial = false;
        } catch (error) {
            runInAction('load activities error', () => {
                console.log(error);
                this.loadingInitial = false;
            });
        }
    }

    @action createActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
           await agent.Activities.create(activity);
           runInAction('creating activity', () => {
            this.activityRegistry.set(activity.id, activity)
            this.editMode = false;
            this.submitting = false;
           });
           
        } catch (error) {   
            runInAction('creating activity error', () => {
                this.submitting = false;
                this.editMode = false;
                console.log(error);
            });
            
        }
    }

    @action editActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
           await agent.Activities.update(activity);
           runInAction('editing activity', () => {
            this.activityRegistry.set(activity.id, activity);
            this.selectedActivity = activity;
            this.editMode = false;
            this.submitting = false;
           })
           
        } catch (error) {
            runInAction('error editing', () => {
                this.submitting = false;
                this.editMode = false;
                console.log(error);
            })
        }
    }

    @action deleteActivity = async (e: SyntheticEvent<HTMLButtonElement>, id: string) => {
        this.submitting = true;
        this.target = e.currentTarget.name;
        try {
            await agent.Activities.delete(id);
            runInAction('deleting activity', () => {
                this.activityRegistry.delete(id);
                this.submitting = false;
                this.target = '';
            })
            
        } catch (error) {
            runInAction('deleting activity error', () => {
                this.submitting = false;
                this.target = '';
                console.log(error);
            }) 
        }
    }

    @action openCreateForm = () => {
        this.editMode = true;
        this.selectedActivity = undefined;
    }

    @action openEditForm = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
        this.editMode = true;
    }

    @action cancelSelectedActivity = () => {
        this.selectedActivity = undefined;
    }

    @action cancelFormOpen = () => {
        this.editMode = false;
    }
    
    @action selectActivity = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
        this.editMode = false;
    }

}


export default  createContext(new ActivityStore())