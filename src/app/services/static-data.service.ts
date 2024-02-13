import {Injectable} from '@angular/core';
import {BehaviorSubject, filter, map, Observable, tap, zip} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {CookieService} from "ngx-cookie-service";
import {Joint} from "../models/joint";
import {Motion} from "../models/motion";
import {MotionEnum} from "../models/ref/motion-enum";
import {JointEnum} from "../models/ref/joint-enum";
import {Standard} from "../models/standard";

@Injectable({
    providedIn: 'root'
})
export class StaticDataService {
    private jointToMotionMapping: Map<JointEnum, Set<MotionEnum>> = new Map();

    private selectedJoint: BehaviorSubject<JointEnum | null> = new BehaviorSubject<JointEnum | null>(null);
    // private joints: BehaviorSubject<JointEnum[]> = new BehaviorSubject<JointEnum[]>(Array.from(StaticDataService.STATIC_JOINTS.keys()));
    private joints: JointEnum[] = Array.from(StaticDataService.STATIC_JOINTS.keys());
    private selectedMotion: BehaviorSubject<MotionEnum | null> = new BehaviorSubject<MotionEnum | null>(null);
    // private motions: BehaviorSubject<MotionEnum[]> = new BehaviorSubject<MotionEnum[]>(Array.from(StaticDataService.STATIC_MOTIONS.keys()));
    private motions: MotionEnum[] = Array.from(StaticDataService.STATIC_MOTIONS.keys());

    private motionsByCurrentJoint: Observable<MotionEnum[]>;

    // private motions: BehaviorSubject<Motion[]> = new BehaviorSubject<Motion[]>(StaticDataService.STATIC_MOTIONS);

    constructor(private httpClient: HttpClient, private cookieService: CookieService) {
        enum indexes {
            jointIndex,
            motionIndex,
            anyAgeIndex,
            minAgeIndex,
            maxAgeIndex,
            sexIndex,
        }

        let localJoint: JointEnum;
        let localMotion: MotionEnum;
        StaticDataService.RAW_STANDARDS.forEach(([joint, motion]) => {
            localJoint = joint as JointEnum;
            localMotion = motion as MotionEnum;

            if (!!localJoint && !!localMotion) {
                if (!this.jointToMotionMapping.has(localJoint)) {
                    this.jointToMotionMapping.set(localJoint, new Set());
                }

                this.jointToMotionMapping.get(localJoint)?.add(localMotion);
            }
        });

        this.motionsByCurrentJoint = this.selectedJoint
            .pipe(
                map(selectedJoint => {
                    if (!selectedJoint) {
                        return [];
                    }

                    return Array.from(this.jointToMotionMapping.get(selectedJoint)?.values() || []);
                })
            )
    }

    getJoints(): JointEnum[] {
        return this.joints;
    }

    getMotions(): MotionEnum[] {
        return this.motions;
    }

    getMotionsForSelectedJoint(): Observable<MotionEnum[]> {
        return this.motionsByCurrentJoint;
        // .pipe(
        //   tap((motions) => console.log('motions', motions))
        // );
    }

    getSelectedMotion(): Observable<MotionEnum | null> {
        return this.selectedMotion.asObservable();
    }

    setSelectedMotion(motion: MotionEnum) {
        this.selectedMotion.next(motion);
    }

    getSelectedJoint(): Observable<JointEnum | null> {
        return this.selectedJoint.asObservable();
    }

    getNotNullSelectedJoint(): Observable<JointEnum> {
        return this.selectedJoint.asObservable().pipe(
            filter(joint => !!joint),
            map((joint) => {
                if (!joint) {
                    throw new Error('no joint after filter');
                }
                return joint;
            })
        );
    }

    setSelectedJoint(joint: JointEnum | null) {
        this.selectedJoint.next(joint);
    }

    updateMotionsByJoint(joint: Joint) {
    }

    filterStandards(joint: JointEnum, motion: MotionEnum, sex: string, age: number | string): Standard[] | null {
        let matchedAnyAgeStandard: Standard;
        let matchedStandard: Standard;

        // const jointIndex = 0;
        // const motionIndex = 1;
        // const anyAgeIndex = 2;
        // const minAgeIndex = 3;
        // const maxAgeIndex = 4;
        // const sexIndex = 5;
        enum indexes {
            jointIndex,
            motionIndex,
            anyAgeIndex,
            minAgeIndex,
            maxAgeIndex,
            sexIndex,
        }

        let matchedStandards: Standard[] = StaticDataService.RAW_STANDARDS.filter(rawStandard => {
            return rawStandard[indexes.jointIndex] == joint &&
                rawStandard[indexes.motionIndex] == motion &&
                rawStandard[indexes.sexIndex] == sex &&
                (
                    rawStandard[indexes.anyAgeIndex] == true ||
                    (
                        age > rawStandard[indexes.minAgeIndex] &&
                        age < rawStandard[indexes.maxAgeIndex]
                    )
                )
        }).map(rawStandard => {
            return {
                joint: rawStandard[indexes.jointIndex],
                motion: rawStandard[indexes.motionIndex],
                sex: rawStandard[indexes.sexIndex],
                allAges: rawStandard[indexes.anyAgeIndex],
                ageMin: rawStandard[indexes.minAgeIndex],
                ageMax: rawStandard[indexes.maxAgeIndex],
                mean: rawStandard[7],
                standardDeviation: rawStandard[8],
                median: rawStandard[9],
                rangeMin: rawStandard[10],
                rangeMax: rawStandard[11],
            } as Standard;
        });

        console.log('Standards:', matchedStandards);

        return matchedStandards;
    }

    static STATIC_JOINTS: Map<JointEnum, Joint> = new Map<JointEnum, Joint>([
        [JointEnum.CERVICAL, {code: JointEnum.CERVICAL, name: 'Neck'}],
        [JointEnum.LEFT_SHOULDER, {code: JointEnum.LEFT_SHOULDER, name: 'Left Shoulder'}],
        [JointEnum.RIGHT_SHOULDER, {code: JointEnum.RIGHT_SHOULDER, name: 'Right Shoulder'}],
        [JointEnum.LEFT_ELBOW, {code: JointEnum.LEFT_ELBOW, name: 'Left Elbow'}],
        [JointEnum.RIGHT_ELBOW, {code: JointEnum.RIGHT_ELBOW, name: 'Right Elbow'}],
        [JointEnum.HIP, {code: JointEnum.HIP, name: 'Hip'}],
        [JointEnum.LUMBAR, {code: JointEnum.LUMBAR, name: 'Lower Back'}],
        [JointEnum.LEFT_KNEE, {code: JointEnum.LEFT_KNEE, name: 'Left Knee'}],
        [JointEnum.RIGHT_KNEE, {code: JointEnum.RIGHT_KNEE, name: 'Right Knee'}],
    ]);

    static STATIC_MOTIONS: Map<MotionEnum, Motion> = new Map<MotionEnum, Motion>([
        [MotionEnum.FLEXION, {code: 'FLEXION', name: 'Flexion'}],
        [MotionEnum.ABDUCTION, {code: 'ABDUCTION', name: 'Abduction'}],
        [MotionEnum.INTERNAL_ROTATION, {code: 'INTERNAL_ROTATION', name: 'Internal Rotation'}],
        [MotionEnum.EXTERNAL_ROTATION, {code: 'EXTERNAL_ROTATION', name: 'External Rotation'}],
        [MotionEnum.EXTENSION, {code: 'EXTENSION', name: 'Extension'}],
        [MotionEnum.LATERAL_FLEXION, {code: 'LATERAL_FLEXION', name: 'Lateral Flexion'}],
    ]);

    /**
     * Right shoulder flexion: https://youtu.be/yhX0GOfSkHU
     * Left shoulder abduction: https://youtu.be/xFxkHbP31bU
     * Shoulder abduction: https://youtu.be/YAfWSVFV7uo
     * Right shoulder extension: https://youtu.be/El0ZV5Uo5OE
     */


    static JOINT_MOTION_MEDIA_MAPPING: Map<{ joint: JointEnum, motion: MotionEnum }, {
        videoUrl: string,
        imageUrl: string
    }> = new Map([
        [
            {joint: JointEnum.RIGHT_SHOULDER, motion: MotionEnum.FLEXION},
            {videoUrl: 'https://youtube.com/embed/yhX0GOfSkHU', imageUrl: ''}
        ],
        [
            {joint: JointEnum.LEFT_SHOULDER, motion: MotionEnum.ABDUCTION},
            {videoUrl: 'https://youtube.com/embed/xFxkHbP31bU', imageUrl: ''}
        ],
        [
            {joint: JointEnum.RIGHT_SHOULDER, motion: MotionEnum.ABDUCTION},
            {videoUrl: 'https://youtube.com/embed/YAfWSVFV7uo', imageUrl: ''}
        ],
        [
            {joint: JointEnum.RIGHT_SHOULDER, motion: MotionEnum.ABDUCTION},
            {videoUrl: 'https://youtube.com/embed/broke', imageUrl: ''}
        ],
    ]);

    getVideoUrlForJointAndMotion(joint: JointEnum, motion: MotionEnum) {
        return {videoUrl: 'https://youtube.com/embed/YAfWSVFV7uo', imageUrl: ''};
        return StaticDataService.JOINT_MOTION_MEDIA_MAPPING.get({joint, motion});
    }


    static RAW_STANDARDS = [
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, true, '', '', 'Male', 'Left', '149.7', '20.3', '152', '0', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, true, '', '', 'Male', 'Right', '151.5', '20.1', '156', '0', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, true, '', '', 'Female', 'Left', '147.7', '20', '150', '22', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, true, '', '', 'Female', 'Right', '149.7', '20.3', '152', '0', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '20', '24', 'Male', 'Left', '158.8', '21.7', '162.3', '90', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '20', '24', 'Male', 'Right', '158.4', '25', '164', '78', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '20', '24', 'Female', 'Left', '156', '13.8', '158', '126', '174'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '20', '24', 'Female', 'Right', '156.4', '12.1', '160', '128', '170'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '25', '29', 'Male', 'Left', '153.4', '14', '153.4', '122', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '25', '29', 'Male', 'Right', '154.1', '13.6', '160', '124', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '25', '29', 'Female', 'Left', '155.2', '13.3', '150', '124', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '25', '29', 'Female', 'Right', '157.3', '15.3', '158.4', '120', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '30', '34', 'Male', 'Left', '156.1', '14.2', '160', '100', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '30', '34', 'Male', 'Right', '157', '15.7', '160', '90', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '30', '34', 'Female', 'Left', '155.9', '12.9', '158', '110', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '30', '34', 'Female', 'Right', '156', '12.7', '156', '100', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '35', '39', 'Male', 'Left', '153', '20.7', '158', '50', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '35', '39', 'Male', 'Right', '155.1', '21.3', '160', '40', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '35', '39', 'Female', 'Left', '156.4', '13', '158', '100', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '35', '39', 'Female', 'Right', '158.8', '12.3', '160', '120', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '40', '44', 'Male', 'Left', '151.6', '16.2', '154', '82', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '40', '44', 'Male', 'Right', '154.9', '14.3', '158', '100', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '40', '44', 'Female', 'Left', '152.5', '15,1', '154', '98', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '40', '44', 'Female', 'Right', '154.9', '15.4', '158', '66', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '45', '49', 'Male', 'Left', '152.4', '14.1', '154', '78', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '45', '49', 'Male', 'Right', '154.5', '14', '156', '104', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '45', '49', 'Female', 'Left', '146.5', '14.5', '150', '90', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '45', '49', 'Female', 'Right', '151.1', '14.9', '152', '100', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '50', '54', 'Male', 'Left', '154.6', '16.2', '160', '74', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '50', '54', 'Male', 'Right', '158.1', '15.9', '160', '60', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '50', '54', 'Female', 'Left', '149.3', '15', '150', '90', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '50', '54', 'Female', 'Right', '127.8', '16.9', '154', '76', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '55', '59', 'Male', 'Left', '146.4', '19.2', '150', '60', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '55', '59', 'Male', 'Right', '148.6', '18.8', '150', '60', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '55', '59', 'Female', 'Left', '146.2', '14.7', '148', '100', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '55', '59', 'Female', 'Right', '149.7', '13.7', '150', '110', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '60', '64', 'Male', 'Left', '145', '18.9', '148', '76', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '60', '64', 'Male', 'Right', '145.9', '18.1', '148', '74', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '60', '64', 'Female', 'Left', '138.2', '23.5', '142', '32', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '60', '64', 'Female', 'Right', '138.8', '26.5', '142', '20', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '65', '69', 'Male', 'Left', '135.7', '28.4', '140', '0', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '65', '69', 'Male', 'Right', '137.5', '28.9', '142', '0', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '65', '69', 'Female', 'Left', '14.5', '19.3', '142.6', '70', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '65', '69', 'Female', 'Right', '142.6', '17.7', '144', '72', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '70', '74', 'Male', 'Left', '134.8', '27.4', '141.6', '0', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '70', '74', 'Male', 'Right', '137.2', '21.2', '141.3', '52', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '70', '74', 'Female', 'Left', '131.8', '22.9', '138', '22', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '70', '74', 'Female', 'Right', '132.7', '30.9', '141.8', '0', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '75', '79', 'Male', 'Left', '134.2', '17.3', '138', '70', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '75', '79', 'Male', 'Right', '136.4', '18.1', '140', '70', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '75', '79', 'Female', 'Left', '127.8', '23.5', '130', '32', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '75', '79', 'Female', 'Right', '133.3', '26.2', '140', '36', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '80', '84', 'Male', 'Left', '125', '27.1', '129', '30', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '80', '84', 'Male', 'Right', '130.5', '22.8', '132', '78', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '80', '84', 'Female', 'Left', '115', '28.7', '121.2', '32', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '80', '84', 'Female', 'Right', '120.9', '26.5', '124.5', '40', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '85', '>', 'Male', 'Left', '119.7', '22.2', '121.7', '80', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '85', '>', 'Male', 'Right', '118.9', '23.4', '111.9', '80', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.ABDUCTION, false, '85', '>', 'Female', 'Left', '118.9', '28.2', '112', '80', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.ABDUCTION, false, '85', '>', 'Female', 'Right', '120', '35.3', '120', '60', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, true, '', '', 'Male', 'Left', '159.9', '18.1', '162', '0', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, true, '', '', 'Male', 'Right', '161.5', '18.7', '165', '14', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, true, '', '', 'Female', 'Left', '157.1', '18.2', '160', '20', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, true, '', '', 'Female', 'Right', '158.5', '19.1', '160', '0', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '20', '24', 'Male', 'Left', '168.6', '13.1', '174', '130', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '20', '24', 'Male', 'Right', '170.8', '18.2', '179.8', '90', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '20', '24', 'Female', 'Left', '166.4', '10.1', '169', '146', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '20', '24', 'Female', 'Right', '164.7', '11.1', '165.8', '140', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '25', '29', 'Male', 'Left', '165', '10.1', '162', '142', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '25', '29', 'Male', 'Right', '165.2', '9.8', '164', '145', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '25', '29', 'Female', 'Left', '164.8', '12.8', '166', '138', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '25', '29', 'Female', 'Right', '166', '13.1', '170', '136', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '30', '34', 'Male', 'Left', '166.2', '12.9', '170', '130', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '30', '34', 'Male', 'Right', '167.9', '11.5', '170', '123', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '30', '34', 'Female', 'Left', '162.9', '12.2', '162', '130', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '30', '34', 'Female', 'Right', '164.4', '13.1', '166.3', '100', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '35', '39', 'Male', 'Left', '162.3', '21.7', '166', '40', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '35', '39', 'Male', 'Right', '162.8', '24.3', '168', '20', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '35', '39', 'Female', 'Left', '165.2', '13.3', '168', '133', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '35', '39', 'Female', 'Right', '166.2', '12.5', '168', '132', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '40', '44', 'Male', 'Left', '160.9', '14.2', '160', '100', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '40', '44', 'Male', 'Right', '165.5', '13.1', '166', '120', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '40', '44', 'Female', 'Left', '160.2', '13.7', '160', '118', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '40', '44', 'Female', 'Right', '163.7', '14', '164', '114', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '45', '49', 'Male', 'Left', '162.9', '12.4', '162', '110', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '45', '49', 'Male', 'Right', '164.9', '13.1', '168', '120', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '45', '49', 'Female', 'Left', '158', '13.3', '160', '124', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '45', '49', 'Female', 'Right', '159.9', '14', '160', '110', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '50', '54', 'Male', 'Left', '163.6', '16.7', '167.1', '110', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '50', '54', 'Male', 'Right', '165', '18.6', '170', '50', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '50', '54', 'Female', 'Left', '158', '14.5', '160', '116', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '50', '54', 'Female', 'Right', '160.1', '14.5', '160', '122', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '55', '59', 'Male', 'Left', '157.3', '15.1', '160', '120', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '55', '59', 'Male', 'Right', '159.4', '15.6', '160', '100', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '55', '59', 'Female', 'Left', '154.7', '15.5', '154', '110', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '55', '59', 'Female', 'Right', '157.1', '14.6', '160', '120', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '60', '64', 'Male', 'Left', '155.9', '15.2', '159.5', '110', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '60', '64', 'Male', 'Right', '157.4', '16.5', '160', '115', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '60', '64', 'Female', 'Left', '146', '26.1', '150', '20', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '60', '64', 'Female', 'Right', '146.5', '27.1', '150', '10', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '65', '69', 'Male', 'Left', '149.9', '20.1', '151.8', '60', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '65', '69', 'Male', 'Right', '152.3', '20.1', '156.1', '78', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '65', '69', 'Female', 'Left', '151.6', '18', '153.9', '78', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '65', '69', 'Female', 'Right', '152.1', '15.7', '152', '80', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '70', '74', 'Male', 'Left', '143.3', '27.2', '150', '0', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '70', '74', 'Male', 'Right', '146.8', '19.3', '147.5', '100', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '70', '74', 'Female', 'Left', '145.9', '17.9', '150', '40', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '70', '74', 'Female', 'Right', '144.8', '29.7', '150.8', '0', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '75', '79', 'Male', 'Left', '143', '18.7', '142', '50', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '75', '79', 'Male', 'Right', '143.4', '26.1', '141.1', '14', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '75', '79', 'Female', 'Left', '138.1', '21', '141.8', '52', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '75', '79', 'Female', 'Right', '141.9', '21.5', '145', '60', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '80', '84', 'Male', 'Left', '137.1', '24.1', '140', '50', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '80', '84', 'Male', 'Right', '140.2', '22', '142.4', '72', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '80', '84', 'Female', 'Left', '132.1', '25.2', '132', '64', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '80', '84', 'Female', 'Right', '133.7', '24.3', '140', '66', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '85', '>', 'Male', 'Left', '129.6', '23.2', '136.1', '90', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '85', '>', 'Male', 'Right', '127.8', '24.4', '123.7', '90', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.FLEXION, false, '85', '>', 'Female', 'Left', '129.9', '30.9', '138', '80', '180'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.FLEXION, false, '85', '>', 'Female', 'Right', '124.1', '39.6', '130', '70', '180'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.INTERNAL_ROTATION, true, '', '', 'Male', 'Left', '62', '12.9', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.INTERNAL_ROTATION, true, '', '', 'Male', 'Right', '62', '12.9', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.INTERNAL_ROTATION, true, '', '', 'Female', 'Left', '62', '12.9', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.INTERNAL_ROTATION, true, '', '', 'Female', 'Right', '62', '12.9', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.INTERNAL_ROTATION, false, '20', '59', 'Male', 'Left', '58', '12', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.INTERNAL_ROTATION, false, '20', '59', 'Male', 'Right', '58', '12', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.INTERNAL_ROTATION, false, '20', '59', 'Female', 'Left', '63', '14', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.INTERNAL_ROTATION, false, '20', '59', 'Female', 'Right', '63', '14', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.INTERNAL_ROTATION, false, '>60', '', 'Male', 'Left', '57', '11', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.INTERNAL_ROTATION, false, '>60', '', 'Male', 'Right', '57', '11', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.INTERNAL_ROTATION, false, '>60', '', 'Female', 'Left', '63', '11.6', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.INTERNAL_ROTATION, false, '>60', '', 'Female', 'Right', '63', '11.6', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, true, '', '', 'Male', 'Left', '83', '12.6', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, true, '', '', 'Male', 'Right', '83', '12.6', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, true, '', '', 'Female', 'Left', '83', '12.6', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, true, '', '', 'Female', 'Right', '83', '12.6', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, false, '20', '59', 'Male', 'Left', '58', '12', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, false, '20', '59', 'Male', 'Right', '58', '12', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, false, '20', '59', 'Female', 'Left', '63', '14', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, false, '20', '59', 'Female', 'Right', '63', '14', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, false, '>60', '', 'Male', 'Left', '71', '12.2', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, false, '>60', '', 'Male', 'Right', '71', '12.2', '', '0', '90'],
        [JointEnum.LEFT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, false, '>60', '', 'Female', 'Left', '72', '13.9', '', '0', '90'],
        [JointEnum.RIGHT_SHOULDER, MotionEnum.EXTERNAL_ROTATION, false, '>60', '', 'Female', 'Right', '72', '13.9', '', '0', '90'],
        ['Shoulder', MotionEnum.EXTENSION, '', '', '', '', '', '', '<45', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, true, '', '', 'Male', '-', '60', '12.6', '', '0', ''],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, true, '', '', 'Female', '-', '60', '12.6', '', '0', ''],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, false, '20', '59', 'Male', '-', '59', '10.8', '', '0', '90'],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, false, '20', '59', 'Male', '-', '59', '10.8', '', '0', '90'],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, false, '20', '59', 'Female', '-', '56', '10.2', '', '0', '90'],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, false, '20', '59', 'Female', '-', '56', '10.2', '', '0', '90'],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, false, '>60', '', 'Male', '-', '55', '12', '', '0', '90'],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, false, '>60', '', 'Male', '-', '55', '12', '', '0', '90'],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, false, '>60', '', 'Female', '-', '53', '10.6', '', '0', '90'],
        [JointEnum.CERVICAL, MotionEnum.FLEXION, false, '>60', '', 'Female', '-', '53', '10.6', '', '0', '90'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, true, '', '', 'Female', '-', '59', '19.2', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, true, '', '', 'Male', '-', '59', '19.2', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, false, '20', '59', 'Male', '-', '58', '13.1', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, false, '20', '59', 'Male', '-', '58', '13.1', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, false, '20', '59', 'Female', '-', '61', '14.7', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, false, '20', '59', 'Female', '-', '616', '14.7', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, false, '>60', '', 'Male', '-', '40', '12.3', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, false, '>60', '', 'Male', '-', '40', '12.3', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, false, '>60', '', 'Female', '-', '43', '13.3', '', '0', '70'],
        [JointEnum.CERVICAL, MotionEnum.EXTENSION, false, '>60', '', 'Female', '-', '43', '13.3', '', '0', '70'],
        [JointEnum.LEFT_CERVICAL, MotionEnum.LATERAL_FLEXION, true, '', '', 'Male', 'Left', '83', '12.6', '', '0', '45'],
        [JointEnum.RIGHT_CERVICAL, MotionEnum.LATERAL_FLEXION, true, '', '', 'Male', 'Right', '83', '12.6', '', '0', '45'],
        [JointEnum.LEFT_CERVICAL, MotionEnum.LATERAL_FLEXION, true, '', '', 'Female', 'Left', '83', '12.6', '', '0', '45'],
        [JointEnum.RIGHT_CERVICAL, MotionEnum.LATERAL_FLEXION, true, '', '', 'Female', 'Right', '83', '12.6', '', '0', '45'],
        [JointEnum.LEFT_CERVICAL, MotionEnum.LATERAL_FLEXION, false, '<25', '-', 'Male', 'Left', '45.2', '7.6', '', '0', '45'],
        [JointEnum.RIGHT_CERVICAL, MotionEnum.LATERAL_FLEXION, false, '<25', '-', 'Male', 'Right', '43.9', '7.7', '', '0', '45'],
        [JointEnum.LEFT_CERVICAL, MotionEnum.LATERAL_FLEXION, '', '<25', '-', 'Female', 'Left', '45.2', '7.6', '', '0', '45'],
        [JointEnum.RIGHT_CERVICAL, MotionEnum.LATERAL_FLEXION, '', '<25', '-', 'Female', 'Right', '43.9', '7.7', '', '0', '45'],
        [JointEnum.LEFT_CERVICAL, MotionEnum.LATERAL_FLEXION, false, '25', '34', 'Male', 'Left', '41.2', '11.9', '', '0', '45'],
        [JointEnum.RIGHT_CERVICAL, MotionEnum.LATERAL_FLEXION, false, '25', '34', 'Male', 'Right', '38.5', '11.2', '', '0', '45'],
        [JointEnum.LEFT_CERVICAL, MotionEnum.LATERAL_FLEXION, '', '25', '34', 'Female', 'Left', '41.2', '11.9', '', '0', '45'],
        [JointEnum.RIGHT_CERVICAL, MotionEnum.LATERAL_FLEXION, '', '25', '34', 'Female', 'Right', '38.5', '11.2', '', '0', '45'],
        [JointEnum.LEFT_CERVICAL, MotionEnum.LATERAL_FLEXION, false, '>35', '-', 'Male', 'Left', '40.6', '9.5', '', '0', '45'],
        [JointEnum.RIGHT_CERVICAL, MotionEnum.LATERAL_FLEXION, false, '>35', '-', 'Male', 'Right', '37.3', '9.2', '', '0', '45'],
        [JointEnum.LEFT_CERVICAL, MotionEnum.LATERAL_FLEXION, false, '>35', '-', 'Female', 'Left', '40.6', '9.5', '', '0', '45'],
        [JointEnum.RIGHT_CERVICAL, MotionEnum.LATERAL_FLEXION, false, '>35', '-', 'Female', 'Right', '37.3', '9.2', '', '0', '45'],

        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, true, '', '', 'Female', '-', '3', '5.9', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, true, '', '', 'Male', '-', '3', '5.9', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, false, '20', '59', 'Male', '-', '2', '5', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, false, '20', '59', 'Male', '-', '2', '5', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, false, '20', '59', 'Female', '-', '4', '5.1', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, false, '20', '59', 'Female', '-', '4', '5.1', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, false, '>60', '', 'Male', '-', '-1', '5', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, false, '>60', '', 'Male', '-', '-1', '5', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, false, '>60', '', 'Female', '-', '0', '5.1', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.EXTENSION, false, '>60', '', 'Female', '-', '0', '5.1', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, true, '', '', 'Female', '-', '148', '5.4', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, true, '', '', 'Male', '-', '148', '5.4', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, false, '20', '59', 'Male', '-', '147', '4.9', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, false, '20', '59', 'Male', '-', '147', '4.9', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, false, '20', '59', 'Female', '-', '149', '5.4', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, false, '20', '59', 'Female', '-', '149', '5.4', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, false, '>60', '', 'Male', '-', '146', '6', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, false, '>60', '', 'Male', '-', '146', '6', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, false, '>60', '', 'Female', '-', '149', '4.7', '', '0', '145'],
        [JointEnum.LEFT_ELBOW, MotionEnum.FLEXION, false, '>60', '', 'Female', '-', '149', '4.7', '', '0', '145'],

        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, true, '', '', 'Female', '-', '3', '5.9', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, true, '', '', 'Male', '-', '3', '5.9', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, false, '20', '59', 'Male', '-', '2', '5', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, false, '20', '59', 'Male', '-', '2', '5', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, false, '20', '59', 'Female', '-', '4', '5.1', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, false, '20', '59', 'Female', '-', '4', '5.1', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, false, '>60', '', 'Male', '-', '-1', '5', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, false, '>60', '', 'Male', '-', '-1', '5', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, false, '>60', '', 'Female', '-', '0', '5.1', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.EXTENSION, false, '>60', '', 'Female', '-', '0', '5.1', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, true, '', '', 'Female', '-', '148', '5.4', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, true, '', '', 'Male', '-', '148', '5.4', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, false, '20', '59', 'Male', '-', '147', '4.9', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, false, '20', '59', 'Male', '-', '147', '4.9', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, false, '20', '59', 'Female', '-', '149', '5.4', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, false, '20', '59', 'Female', '-', '149', '5.4', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, false, '>60', '', 'Male', '-', '146', '6', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, false, '>60', '', 'Male', '-', '146', '6', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, false, '>60', '', 'Female', '-', '149', '4.7', '', '0', '145'],
        [JointEnum.RIGHT_ELBOW, MotionEnum.FLEXION, false, '>60', '', 'Female', '-', '149', '4.7', '', '0', '145'],

        // I changed KNEE to left knee / right knee
        [JointEnum.RIGHT_KNEE, MotionEnum.FLEXION, true, '', '', 'Female', '-', '132', '10', '', '0', '145'],
        [JointEnum.RIGHT_KNEE, MotionEnum.FLEXION, true, '', '', 'Male', '-', '132', '10', '', '0', '145'],
        [JointEnum.RIGHT_KNEE, MotionEnum.FLEXION, false, '25', '39', 'Female', '-', '134', '9', '', '0', '135'],
        [JointEnum.RIGHT_KNEE, MotionEnum.FLEXION, false, '25', '39', 'Male', '-', '134', '9', '', '0', '135'],
        [JointEnum.RIGHT_KNEE, MotionEnum.FLEXION, false, '40', '59', 'Female', '-', '132', '11', '', '0', '135'],
        [JointEnum.RIGHT_KNEE, MotionEnum.FLEXION, false, '40', '59', 'Male', '-', '132', '11', '', '0', '135'],
        [JointEnum.RIGHT_KNEE, MotionEnum.FLEXION, false, '60', '74', 'Female', '-', '131', '11', '', '0', '135'],
        [JointEnum.RIGHT_KNEE, MotionEnum.FLEXION, false, '60', '74', 'Male', '-', '131', '11', '', '0', '135'],

        [JointEnum.LEFT_KNEE, MotionEnum.FLEXION, true, '', '', 'Female', '-', '132', '10', '', '0', '145'],
        [JointEnum.LEFT_KNEE, MotionEnum.FLEXION, true, '', '', 'Male', '-', '132', '10', '', '0', '145'],
        [JointEnum.LEFT_KNEE, MotionEnum.FLEXION, false, '25', '39', 'Female', '-', '134', '9', '', '0', '135'],
        [JointEnum.LEFT_KNEE, MotionEnum.FLEXION, false, '25', '39', 'Male', '-', '134', '9', '', '0', '135'],
        [JointEnum.LEFT_KNEE, MotionEnum.FLEXION, false, '40', '59', 'Female', '-', '132', '11', '', '0', '135'],
        [JointEnum.LEFT_KNEE, MotionEnum.FLEXION, false, '40', '59', 'Male', '-', '132', '11', '', '0', '135'],
        [JointEnum.LEFT_KNEE, MotionEnum.FLEXION, false, '60', '74', 'Female', '-', '131', '11', '', '0', '135'],
        [JointEnum.LEFT_KNEE, MotionEnum.FLEXION, false, '60', '74', 'Male', '-', '131', '11', '', '0', '135'],


        // [JointEnum.LEFT_KNEE, 'Squat Depth Knee', 'all ages', '-', '-', '-', 'Left', '<90', '-', '-', '-', '>90'],
        // [JointEnum.RIGHT_KNEE, 'Squat Depth Knee', 'all ages', '-', '-', '-', 'Right', '<90', '-', '-', '-', '>90'],
        // [JointEnum.LEFT_KNEE, 'Squat Lateral Shif Knee', 'all ages', '-', '-', '-', 'Left', '>12', '-', '-', '-', '>90'],
        // [JointEnum.RIGHT_KNEE, 'Squat Lateral Shif knee', 'all ages', '-', '-', '-', 'Right', '>12', '-', '-', '-', '>90'],

        [JointEnum.HIP, MotionEnum.FLEXION, true, '', '', 'Female', '-', '121', '13', '', '0', '120'],
        [JointEnum.HIP, MotionEnum.FLEXION, true, '', '', 'Male', '-', '121', '13', '', '0', '120'],
        [JointEnum.HIP, MotionEnum.FLEXION, false, '25', '39', 'Female', '-', '122', '12', '', '0', '120'],
        [JointEnum.HIP, MotionEnum.FLEXION, false, '25', '39', 'Male', '-', '122', '12', '', '0', '120'],
        [JointEnum.HIP, MotionEnum.FLEXION, false, '40', '59', 'Female', '-', '120', '14', '', '0', '120'],
        [JointEnum.HIP, MotionEnum.FLEXION, false, '40', '59', 'Male', '-', '120', '14', '', '0', '120'],
        [JointEnum.HIP, MotionEnum.FLEXION, false, '60', '74', 'Female', '-', '118', '13', '', '0', '120'],
        [JointEnum.HIP, MotionEnum.FLEXION, false, '60', '74', 'Male', '-', '118', '13', '', '0', '120'],
        [JointEnum.HIP, MotionEnum.EXTENSION, true, '', '', 'Female', '-', '19', '8', '', '0', '20'],
        [JointEnum.HIP, MotionEnum.EXTENSION, true, '', '', 'Male', '-', '19', '8', '', '0', '20'],
        [JointEnum.HIP, MotionEnum.EXTENSION, false, '25', '39', 'Female', '-', '22', '8', '', '0', '20'],
        [JointEnum.HIP, MotionEnum.EXTENSION, false, '25', '39', 'Male', '-', '22', '8', '', '0', '20'],
        [JointEnum.HIP, MotionEnum.EXTENSION, false, '40', '59', 'Female', '-', '18', '7', '', '0', '20'],
        [JointEnum.HIP, MotionEnum.EXTENSION, false, '40', '59', 'Male', '-', '18', '7', '', '0', '20'],
        [JointEnum.HIP, MotionEnum.EXTENSION, false, '60', '74', 'Female', '-', '17', '8', '', '0', '20'],
        [JointEnum.HIP, MotionEnum.EXTENSION, false, '60', '74', 'Male', '-', '17', '8', '', '0', '20'],
        [JointEnum.HIP, MotionEnum.ABDUCTION, true, '', '', 'Female', '-', '42', '11', '', '0', '45'],
        [JointEnum.HIP, MotionEnum.ABDUCTION, true, '', '', 'Male', '-', '42', '11', '', '0', '45'],
        [JointEnum.HIP, MotionEnum.ABDUCTION, false, '25', '39', 'Female', '-', '44', '11', '', '0', '45'],
        [JointEnum.HIP, MotionEnum.ABDUCTION, false, '25', '39', 'Male', '-', '44', '11', '', '0', '45'],
        [JointEnum.HIP, MotionEnum.ABDUCTION, false, '40', '59', 'Female', '-', '42', '11', '', '0', '45'],
        [JointEnum.HIP, MotionEnum.ABDUCTION, false, '40', '59', 'Male', '-', '42', '11', '', '0', '45'],
        [JointEnum.HIP, MotionEnum.ABDUCTION, false, '60', '74', 'Female', '-', '39', '12', '', '0', '45'],
        [JointEnum.HIP, MotionEnum.ABDUCTION, false, '60', '74', 'Male', '-', '39', '12', '', '0', '45'],
        ['LeftLE Screen', 'Squat Depth HiP', 'all ages', '-', '-', '-', 'Left', '<90', '-', '-', '-', '>90'],
        ['RightLE Screen', 'Squat Depth HiP', 'all ages', '-', '-', '-', 'Right', '<90', '-', '-', '-', '>90'],
        ['LeftLE Screen', 'Squat Lateral Shif Hip', 'all ages', '-', '-', '-', 'Left', '>12', '-', '-', '-', '>90'],
        ['RightLE Screen', 'Squat Lateral Shif Hip', 'all ages', '-', '-', '-', 'Right', '>12', '-', '-', '-', '>90'],
        [JointEnum.LUMBAR, MotionEnum.FLEXION, true, '', '', 'Male', '-', '56.2', '9', '', '0', '60'],
        [JointEnum.LUMBAR, MotionEnum.FLEXION, true, '', '', 'Female', '-', '56.2', '9', '', '0', '60'],
        [JointEnum.LUMBAR, MotionEnum.FLEXION, false, '10', '24', 'Male', '-', '63.4', '8.3', '', '0', '60'],
        [JointEnum.LUMBAR, MotionEnum.FLEXION, false, '10', '24', 'Male', '-', '63.4', '8.3', '', '0', '60'],
        [JointEnum.LUMBAR, MotionEnum.FLEXION, false, '25', '35', 'Female', '-', '64.3', '10.5', '', '0', '60'],
        [JointEnum.LUMBAR, MotionEnum.FLEXION, false, '25', '35', 'Female', '-', '64.3', '10.5', '', '0', '60'],
        [JointEnum.LUMBAR, MotionEnum.FLEXION, false, '36', '100', 'Male', '-', '56.2', '9', '', '0', '60'],
        [JointEnum.LUMBAR, MotionEnum.FLEXION, false, '36', '100', 'Male', '-', '56.2', '9', '', '0', '60'],
        [JointEnum.LUMBAR, MotionEnum.EXTENSION, true, '', '', 'Female', '-', '17.7', '6.4', '', '0', '25'],
        [JointEnum.LUMBAR, MotionEnum.EXTENSION, true, '', '', 'Male', '-', '17.7', '6.4', '', '0', '25'],
        [JointEnum.LUMBAR, MotionEnum.EXTENSION, false, '10', '24', 'Male', '-', '20.7', '6.7', '', '0', '25'],
        [JointEnum.LUMBAR, MotionEnum.EXTENSION, false, '10', '24', 'Male', '-', '20.7', '6.7', '', '0', '25'],
        [JointEnum.LUMBAR, MotionEnum.EXTENSION, false, '25', '35', 'Female', '-', '20.3', '7.5', '', '0', '25'],
        [JointEnum.LUMBAR, MotionEnum.EXTENSION, false, '25', '35', 'Female', '-', '20.3', '7.5', '', '0', '25'],
        [JointEnum.LUMBAR, MotionEnum.EXTENSION, false, '36', '100', 'Male', '-', '17.7', '6.4', '', '0', '25'],
        [JointEnum.LUMBAR, MotionEnum.EXTENSION, false, '36', '100', 'Male', '-', '17.7', '6.4', '', '0', '25'],
        [JointEnum.LEFT_LUMBAR, MotionEnum.LATERAL_FLEXION, true, '', '', 'Male', 'Left', '27.1', '7.4', '', '0', '20'],
        [JointEnum.RIGHT_LUMBAR, MotionEnum.LATERAL_FLEXION, true, '', '', 'Male', 'Right', '23.7', '6.7', '', '0', '20'],
        [JointEnum.LEFT_LUMBAR, MotionEnum.LATERAL_FLEXION, true, '', '', 'Female', 'Left', '27.1', '7.4', '', '0', '20'],
        [JointEnum.RIGHT_LUMBAR, MotionEnum.LATERAL_FLEXION, true, '', '', 'Female', 'Right', '23.7', '6.7', '', '0', '20'],
        [JointEnum.LEFT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '10', '24', 'Male', 'Left', '22.2', '7', '', '0', '20'],
        [JointEnum.RIGHT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '10', '24', 'Male', 'Right', '19.6', '6.6', '', '0', '20'],
        [JointEnum.LEFT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '10', '24', 'Female', 'Left', '22.2', '7', '', '0', '20'],
        [JointEnum.RIGHT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '10', '24', 'Female', 'Right', '19.6', '6.6', '', '0', '20'],
        [JointEnum.LEFT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '25', '35', 'Male', 'Left', '26.4', '8.7', '', '0', '20'],
        [JointEnum.RIGHT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '25', '35', 'Male', 'Right', '24.6', '8.5', '', '0', '20'],
        [JointEnum.LEFT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '25', '35', 'Female', 'Left', '26.4', '8.7', '', '0', '20'],
        [JointEnum.RIGHT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '25', '35', 'Female', 'Right', '24.6', '8.5', '', '0', '20'],
        [JointEnum.LEFT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '36', '100', 'Male', 'Left', '27.1', '7.4', '', '0', '20'],
        [JointEnum.RIGHT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '36', '100', 'Male', 'Right', '23.7', '6.7', '', '0', '20'],
        [JointEnum.LEFT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '36', '100', 'Female', 'Left', '27.1', '7.4', '', '0', '20'],
        [JointEnum.RIGHT_LUMBAR, MotionEnum.LATERAL_FLEXION, false, '36', '100', 'Female', 'Right', '23.7', '6.7', '', '0', '20'],
        ['LeftLE Screen', 'Squat Depth HiP', 'all ages', '-', '-', '-', 'Left', '<90', '-', '-', '-', '>90'],
        ['RightLE Screen', 'Squat Depth HiP', 'all ages', '-', '-', '-', 'Right', '<90', '-', '-', '-', '>90'],
        ['LeftLE Screen', 'Squat Lateral Shif Hip', 'all ages', '-', '-', '-', 'Left', '>12', '-', '-', '-', '>90'],
        ['RightLE Screen', 'Squat Lateral Shif Hip', 'all ages', '-', '-', '-', 'Right', '>12', '-', '-', '-', '>90'],
        ['LeftLE Screen', 'Squat Depth Knee', 'all ages', '-', '-', '-', 'Left', '<90', '-', '-', '-', '>90'],
        ['RightLE Screen', 'Squat Depth Knee', 'all ages', '-', '-', '-', 'Right', '<90', '-', '-', '-', '>90'],
        ['LeftLE Screen', 'Squat Lateral Shif Knee', 'all ages', '-', '-', '-', 'Left', '>12', '-', '-', '-', '>90'],
        ['RightLE Screen', 'Squat Lateral Shif knee', 'all ages', '-', '-', '-', 'Right', '>12', '-', '-', '-', '>90'],
        ['LeftLE Screen', 'toe raises', 'all ages', '-', '-', '-', 'Left', '<7', '-', '-', '-', '>7'],
        ['RightLE Screen', 'Heel raises', 'all ages', '-', '-', '-', 'Right', '<7', '-', '-', '-', '>7'],
    ];
}
