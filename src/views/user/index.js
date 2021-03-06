// @flow
import * as React from 'react';
import compose from 'recompose/compose';
import { type History, type Match } from 'react-router';
import { connect } from 'react-redux';
import generateMetaInfo from 'shared/generate-meta-info';
import Link from 'src/components/link';
import AppViewWrapper from 'src/components/appViewWrapper';
import Head from 'src/components/head';
import ThreadFeed from 'src/components/threadFeed';
import { initNewThreadWithUser } from '../../actions/directMessageThreads';
import { UserProfile } from 'src/components/profile';
import { LoadingScreen } from 'src/components/loading';
import { NullState } from 'src/components/upsell';
import { Button, ButtonRow, TextButton } from 'src/components/buttons';
import CommunityList from './components/communityList';
import Search from './components/search';
import {
  getUserByMatch,
  type GetUserType,
} from 'shared/graphql/queries/user/getUser';
import getUserThreads from 'shared/graphql/queries/user/getUserThreadConnection';
import ViewError from 'src/components/viewError';
import Titlebar from '../titlebar';
import { CoverPhoto } from 'src/components/profile/coverPhoto';
import { LoginButton } from '../community/style';
import viewNetworkHandler from 'src/components/viewNetworkHandler';
import type { Dispatch } from 'redux';
import {
  Grid,
  Meta,
  Content,
  Extras,
  ColumnHeading,
  MetaMemberships,
} from './style';
import {
  SegmentedControl,
  DesktopSegment,
  MobileSegment,
} from 'src/components/segmentedControl';
import { ErrorBoundary } from 'src/components/error';
import { openModal } from 'src/actions/modals';

const ThreadFeedWithData = compose(
  connect(),
  getUserThreads
)(ThreadFeed);
const ThreadParticipantFeedWithData = compose(
  connect(),
  getUserThreads
)(ThreadFeed);

type Props = {
  match: Match,
  currentUser: Object,
  data: {
    user: GetUserType,
  },
  isLoading: boolean,
  hasError: boolean,
  queryVarIsChanging: boolean,
  dispatch: Dispatch<Object>,
  history: History,
};

type State = {
  hasNoThreads: boolean,
  selectedView: string,
  hasThreads: boolean,
};

class UserView extends React.Component<Props, State> {
  state = {
    hasNoThreads: false,
    selectedView: 'participant',
    hasThreads: true,
  };

  componentDidMount() {}

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.data.user) return;
    // track when a new profile is viewed without the component having been remounted
    if (prevProps.data.user.id !== this.props.data.user.id) {
    }
  }

  hasNoThreads = () => this.setState({ hasThreads: false });
  hasThreads = () => this.setState({ hasThreads: true });

  handleSegmentClick = (label: string) => {
    if (this.state.selectedView === label) return;

    return this.setState({
      selectedView: label,
      hasThreads: true,
    });
  };

  initMessage = user => {
    this.props.dispatch(initNewThreadWithUser(user));
    this.props.history.push('/messages/new');
  };

  initReport = () => {
    const {
      data: { user },
      dispatch,
    } = this.props;
    return dispatch(openModal('REPORT_USER_MODAL', { user }));
  };

  render() {
    const {
      data: { user },
      isLoading,
      hasError,
      queryVarIsChanging,
      match: {
        params: { username },
      },
      currentUser,
    } = this.props;
    const { hasThreads, selectedView } = this.state;

    if (queryVarIsChanging) {
      return <LoadingScreen />;
    }

    if (user && user.id) {
      const { title, description } = generateMetaInfo({
        type: 'user',
        data: {
          name: user.name,
          username: user.username,
          description: user.description,
        },
      });

      const nullHeading = `${
        user.firstName ? user.firstName : user.name
      } hasn’t ${
        selectedView === 'creator' ? 'created' : 'joined'
      } any conversations yet.`;

      const Feed =
        selectedView === 'creator'
          ? ThreadFeedWithData
          : ThreadParticipantFeedWithData;

      return (
        <AppViewWrapper data-cy="user-view">
          <Head
            title={title}
            description={description}
            image={user.profilePhoto}
            type="profile"
          >
            <meta property="profile:last_name" content={user.name} />
            <meta property="profile:username" content={user.username} />
          </Head>
          <Titlebar
            title={user.name}
            subtitle={'Posts By'}
            provideBack={true}
            backRoute={'/'}
            noComposer
          />
          <Grid id="main">
            <CoverPhoto src={user.coverPhoto} />
            <Meta>
              <ErrorBoundary fallbackComponent={null}>
                <UserProfile
                  data={{ user }}
                  username={username}
                  profileSize="full"
                  showHoverProfile={false}
                />
              </ErrorBoundary>

              {currentUser &&
                user.id !== currentUser.id && (
                  <React.Fragment>
                    <LoginButton onClick={() => this.initMessage(user)}>
                      Message {user.name}
                    </LoginButton>
                    <TextButton onClick={this.initReport}>Report</TextButton>
                  </React.Fragment>
                )}
              {currentUser &&
                user.id === currentUser.id && (
                  <Link to={`/users/${username}/settings`}>
                    <LoginButton isMember>My settings</LoginButton>
                  </Link>
                )}

              <ErrorBoundary fallbackComponent={null}>
                <MetaMemberships>
                  <ColumnHeading>Member of</ColumnHeading>
                  <CommunityList
                    currentUser={currentUser}
                    user={user}
                    id={user.id}
                  />
                </MetaMemberships>
              </ErrorBoundary>
            </Meta>
            <Content>
              <SegmentedControl style={{ margin: '16px 0 0 0' }}>
                <DesktopSegment
                  segmentLabel="search"
                  onClick={() => this.handleSegmentClick('search')}
                  selected={selectedView === 'search'}
                >
                  Search
                </DesktopSegment>

                <DesktopSegment
                  segmentLabel="participant"
                  onClick={() => this.handleSegmentClick('participant')}
                  selected={selectedView === 'participant'}
                >
                  Replies
                </DesktopSegment>

                <DesktopSegment
                  segmentLabel="creator"
                  onClick={() => this.handleSegmentClick('creator')}
                  selected={selectedView === 'creator'}
                >
                  Threads
                </DesktopSegment>
                <MobileSegment
                  segmentLabel="search"
                  onClick={() => this.handleSegmentClick('search')}
                  selected={selectedView === 'search'}
                >
                  Search
                </MobileSegment>
                <MobileSegment
                  segmentLabel="participant"
                  onClick={() => this.handleSegmentClick('participant')}
                  selected={selectedView === 'participant'}
                >
                  Replies
                </MobileSegment>
                <MobileSegment
                  segmentLabel="creator"
                  onClick={() => this.handleSegmentClick('creator')}
                  selected={selectedView === 'creator'}
                >
                  Threads
                </MobileSegment>
              </SegmentedControl>

              {hasThreads &&
                (selectedView === 'creator' ||
                  selectedView === 'participant') && (
                  <Feed
                    userId={user.id}
                    username={username}
                    viewContext={
                      selectedView === 'participant'
                        ? 'userProfileReplies'
                        : 'userProfile'
                    }
                    hasNoThreads={this.hasNoThreads}
                    hasThreads={this.hasThreads}
                    kind={selectedView}
                    id={user.id}
                  />
                )}

              {selectedView === 'search' && <Search user={user} />}

              {!hasThreads && <NullState bg="null" heading={nullHeading} />}
            </Content>
            <Extras>
              <ErrorBoundary fallbackComponent={null}>
                <ColumnHeading>Member of</ColumnHeading>
                <CommunityList
                  currentUser={currentUser}
                  user={user}
                  id={user.id}
                />
              </ErrorBoundary>
            </Extras>
          </Grid>
        </AppViewWrapper>
      );
    }

    if (isLoading) {
      return <LoadingScreen />;
    }

    if (hasError) {
      return (
        <AppViewWrapper>
          <Titlebar
            title={'User not found'}
            provideBack={true}
            backRoute={'/'}
            noComposer
          />
          <ViewError
            heading={'We ran into an error loading this user.'}
            refresh
          />
        </AppViewWrapper>
      );
    }

    if (!user) {
      return (
        <AppViewWrapper>
          <Titlebar
            title={'User not found'}
            provideBack={true}
            backRoute={'/'}
            noComposer
          />
          <ViewError
            dataCy="user-not-found"
            heading={'We couldn’t find anyone with this username.'}
          >
            <ButtonRow>
              <Link to={'/'}>
                <Button large>Take me home</Button>
              </Link>
            </ButtonRow>
          </ViewError>
        </AppViewWrapper>
      );
    }
  }
}

const map = state => ({ currentUser: state.users.currentUser });
export default compose(
  // $FlowIssue
  connect(map),
  getUserByMatch,
  viewNetworkHandler
)(UserView);
