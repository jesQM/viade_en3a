import React, { Component } from 'react';
import EditableMap from '../components/editableMap/EditableMap';
import MyRoute from "./../model/MyRoute";
import PodStorageHandler from "./../components/podService/podStoreHandler";
import { Button, InputGroup, FormControl } from 'react-bootstrap';
import { Translation } from 'react-i18next';

import './../css/App.css';

const auth = require('solid-auth-client');

class MapCreation extends Component {

	constructor(props) {
		super(props);
		this.routeName = React.createRef();
		this.points = React.createRef();
		this.routeManager = props.routeManager;
		this.tempRoute = undefined;
	}

	render() {
		return (
			<div id="routeCreationContainer" className="App-header" style={{ height: "80%" }} >
				<Translation>
					{
						(t) => <h1>{t('mapCreationTitle')}</h1>
					}
				</Translation>
				
				<InputGroup className="mb-3" style={{ width: "50vw" }}>
					<InputGroup.Prepend>
						<Translation>
							{
								(t) => <InputGroup.Text id="basic-addon1">{t('mapCreationName')}</InputGroup.Text>
							}
						</Translation>
					</InputGroup.Prepend>
					<FormControl
						ref={this.routeName}
						aria-describedby="basic-addon1"
						role='title'
					/>
				</InputGroup>
				<EditableMap ref={this.points} role='map' />
				<Translation>
					{
						(t) => <Button variant="primary" onClick={() => this.uploadToPod()} style={{ margin: "1.5vh" }}>{t('mapCreationSaveButton')}</Button>
					}
				</Translation>
				<input id="pictureUploader" type="file" name="file" onChange={this.onChangeHandler} />
			</div>
		);
	}

	createRoute() {
		let name = this.routeName.current.value;
		let waypoints = this.points.current.state.points;
		let route = new MyRoute(name, "Temp author", "Temp description", waypoints);
		return route;
	}

	checkRouteChanged(newRoute) {
		if ((this.tempRoute === undefined) || (this.tempRoute !== undefined && (this.tempRoute.getComparableString() !== newRoute.getComparableString()))) {
			this.tempRoute = newRoute;
			this.routeManager.addRoute(this.tempRoute);
			return newRoute;
		} else {
			return this.tempRoute;
		}
	}

	async uploadToPod() {
		let route = this.createRoute();
		route = this.checkRouteChanged(route);
		let session = await auth.currentSession();
		let storageHandler = new PodStorageHandler(session);
		storageHandler.storeRoute(route.getFileName(), route.toJsonLd(), (filePodUrl, podResponse) => {
			let alertText = "";
			if (filePodUrl === null) {
				alertText = "We are sorry!! Something went wrong while uploading your brand new route to your POD";
			} else {
				alertText = "Your brand new shiny route has been successfully uploaded to your pod";
			}
			alert(alertText);
		});
	}

}

export default MapCreation;