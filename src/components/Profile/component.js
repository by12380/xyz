import React, { Component } from 'react';
import { logOut } from '../../utils/auth0';
import './Profile.css';
import Peer from 'peerjs';

class Profile extends Component {

    state = {
        session: {
            mediaConnection: null,
            stream: null
        },
        peerId: null
    }

    peer = new Peer();

    componentDidMount() {
        this.props.fetchUser(this.props.token);
        this.initPeerJS();
    }

    onLogOut = () => {
        this.props.removeSession();
        logOut();
    }

    render() {
        return (
            <div>
                { this.props.profile.picture
                ? <img className='profile-img' src={this.props.profile.picture} alt='User Profile'/>
                : null }

                { this.props.profile.name
                ? <p>Welcome, {this.props.profile.name}</p>
                : null }

                <button className='logout-btn' onClick={this.onLogOut}>Logout</button>

                <div style={{marginTop: 20}}>
                    { this.state.peerId
                        ? <p>Your video id is: {this.state.peerId}</p>
                        : null
                    }
                    
                    { this.state.session.mediaConnection
                        ? <button onClick={this.closeConnection}>Close connection</button>
                        : ( <div>
                                <input type="text" ref={(el) => this.input = el}/>
                                <button onClick={this.openConnection}>Call</button>
                            </div> )
                    }

                    <div>
                        <video ref={(el) => {this.video = el}} style={{minWidth: 800, marginTop: 30}}></video>
                    </div>
                </div>
            </div>
        );
    }

    initPeerJS = () => {
        const instance = this;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        this.peer.on('open', (id) => {
            this.setState({peerId: id});
        });

        //Listener for incoming calls
        this.peer.on('call', function(mediaConnection) {
            navigator.getUserMedia({video: true, audio: true}, function(stream) {
                mediaConnection.answer(stream); // Answer the call with an A/V stream.

                //On successful connection
                mediaConnection.on('stream', function(mediaStream) {
                    //Display stream in video element
                    instance.video.srcObject = mediaStream;
                    instance.video.onloadedmetadata = function(e) {
                        instance.video.play();
                    };

                    //Store connection objects locally
                    instance.setState({
                        session: {
                            mediaConnection,
                            stream
                        }
                    });
                });

                //On disconnection
                mediaConnection.on('close', function() {
                    instance.closeConnection();
                })
            }, function(err) {
                console.log('Failed to get local stream' ,err);
            });
        });
    }

    openConnection = () => {
        const instance = this;
        const peerId = this.input.value;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        navigator.getUserMedia({video: true, audio: true}, (stream) => {
            const mediaConnection = this.peer.call(peerId, stream);

            //On successful connection
            mediaConnection.on('stream', function(mediaStream) {
                //Display stream in video element
                instance.video.srcObject = mediaStream;
                instance.video.onloadedmetadata = function(e) {
                    instance.video.play();
                };

                //Store connection objects locally
                instance.setState({
                    session: {
                        mediaConnection,
                        stream
                    }
                });
            });

            //On disconnection
            mediaConnection.on('close', function() {
                instance.closeConnection();
            })
        }, function(err) {
          console.log('Failed to get local stream' ,err);
        });
    }

    closeConnection = () => {
        const session = this.state.session;

        //Close connection between two parties in peerJS
        session.mediaConnection.close();

        //Stop video stream and close camera in browser
        session.stream.getTracks().forEach(track => track.stop());

        this.setState({
            session: {
                mediaConnection: null,
                stream: null
            }
        });
    }
}

export default Profile;