// @flow
import { db } from 'api/models/db';

export const removeAllCommunityModerators = (communityId: string) => {
  return db
    .table('usersCommunities')
    .getAll([communityId, true], { index: 'communityIdAndIsModerator' })
    .update({ isModerator: false })
    .run();
};
