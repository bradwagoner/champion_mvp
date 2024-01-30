import {JointEnum} from "./app/models/ref/joint-enum";

export const Messages = {

  enums: {
    joint: (joint: JointEnum | null) => {
      switch (joint) {
        case null: return 'joint';
        case JointEnum.RIGHT_KNEE: return 'right knee';
        case JointEnum.LEFT_KNEE: return 'left knee';
        case JointEnum.LEFT_SHOULDER: return 'left shoulder';
        case JointEnum.RIGHT_SHOULDER: return 'right shoulder';
        case JointEnum.LEFT_ELBOW: return 'left elbow';
        case JointEnum.RIGHT_ELBOW: return 'right elbow';
        case JointEnum.CERVICAL: return 'neck';
        case JointEnum.LEFT_CERVICAL: return 'neck';
        case JointEnum.RIGHT_CERVICAL: return 'neck';
        case JointEnum.HIP: return 'hip';
        case JointEnum.LUMBAR: return 'lower back';
        case JointEnum.LEFT_LUMBAR: return 'left lower back';
        case JointEnum.RIGHT_LUMBAR: return 'right lower back';
      }
    }
  },
  models: {
    questionnaire: {
      form: {
        experiencedPain: 'Did you experience any pain during any of the motions during the screening?',
        experiencedWeakness: (joint: JointEnum | null) => `During a normal day do you experience any weakness in your ${Messages.enums.joint(joint)}?`,
        avoidedOrUnable: (joint: JointEnum | null) => `Do you avoid, compensate, or not perform any activities due to your ${Messages.enums.joint(joint)}?`,
        recentImprovement: 'Has the joint pain or range of motion improved of the last 4 weeks?',
        disruptsSleep: (joint: JointEnum | null) => `Does your ${Messages.enums.joint(joint)} discomfort disrupt your sleep in any way?`,
      }
    }
  }

}
